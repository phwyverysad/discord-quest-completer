// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
use once_cell::sync::OnceCell;
use std::env;
use std::fs;
use std::path::{Path, PathBuf};
use std::sync::Mutex;
use tauri::{path::BaseDirectory, AppHandle, Emitter, Listener, Manager};

mod multi_ipc;
mod rpc;
mod runner;

// Global static instance of the Discord client
static DISCORD_CLIENT: OnceCell<Mutex<Option<rpc::Client>>> = OnceCell::new();

fn get_discord_client() -> &'static Mutex<Option<rpc::Client>> {
    DISCORD_CLIENT.get_or_init(|| Mutex::new(None))
}

fn runner_resource_name() -> &'static str {
    #[cfg(target_os = "windows")]
    let runner_name = "data/src-win.exe";

    #[cfg(target_os = "linux")]
    let runner_name = "data/src-linux";

    #[cfg(target_os = "macos")]
    let runner_name = "data/src-darwin";

    runner_name
}

fn is_app_bundle(executable_name: &str) -> bool {
    cfg!(target_os = "macos") && executable_name.ends_with(".app")
}

fn bundle_binary_name(app_name: &str) -> String {
    app_name
        .strip_suffix(".app")
        .unwrap_or(app_name)
        .to_string()
}

fn get_base_games_dir() -> PathBuf {
    env::temp_dir().join("discord-quest-completer").join("games")
}

fn game_folder_path(path: &str, app_id: i64) -> PathBuf {
    let normalized_path = Path::new(path).to_string_lossy().to_string();

    get_base_games_dir()
        .join(app_id.to_string())
        .join(normalized_path)
}

fn resolve_runner_template(handle: &AppHandle) -> Result<PathBuf, String> {
    handle
        .path()
        .resolve(runner_resource_name(), BaseDirectory::Resource)
        .map_err(|e| format!("Failed to resolve runner template: {}", e))
}

fn make_macos_app_bundle(
    app_bundle_path: &Path,
    app_name: &str,
    display_name: &str,
    runner_template: &Path,
) -> Result<PathBuf, String> {
    let binary_name = bundle_binary_name(app_name);
    let macos_dir = app_bundle_path.join("Contents/MacOS");
    fs::create_dir_all(&macos_dir)
        .map_err(|e| format!("Failed to create app bundle directories: {}", e))?;

    let target_executable_path = macos_dir.join(&binary_name);
    fs::copy(runner_template, &target_executable_path)
        .map_err(|e| format!("Failed to copy dummy executable: {}", e))?;

    #[cfg(unix)]
    {
        use std::os::unix::fs::PermissionsExt;
        let mut permissions = fs::metadata(&target_executable_path)
            .map_err(|e| format!("Failed to read executable permissions: {}", e))?
            .permissions();
        permissions.set_mode(0o755);
        fs::set_permissions(&target_executable_path, permissions)
            .map_err(|e| format!("Failed to set executable permissions: {}", e))?;
    }

    let info_plist = format!(
        r#"<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleDisplayName</key>
    <string>{display_name}</string>
    <key>CFBundleExecutable</key>
    <string>{binary_name}</string>
    <key>CFBundleIdentifier</key>
    <string>me.markterence.discordquestcompleter.dummy</string>
    <key>CFBundleName</key>
    <string>{display_name}</string>
    <key>CFBundlePackageType</key>
    <string>APPL</string>
    <key>CFBundleShortVersionString</key>
    <string>1.0</string>
    <key>CFBundleVersion</key>
    <string>1</string>
</dict>
</plist>
"#
    );

    fs::write(app_bundle_path.join("Contents/Info.plist"), info_plist)
        .map_err(|e| format!("Failed to write Info.plist: {}", e))?;

    Ok(target_executable_path)
}

fn launch_executable_path(game_folder_path: &Path, executable_name: &str) -> PathBuf {
    if is_app_bundle(executable_name) {
        game_folder_path
            .join(executable_name)
            .join("Contents/MacOS")
            .join(bundle_binary_name(executable_name))
    } else {
        game_folder_path.join(executable_name)
    }
}

fn stop_process_name(exec_name: &str) -> String {
    if is_app_bundle(exec_name) {
        bundle_binary_name(exec_name)
    } else {
        exec_name.to_string()
    }
}

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command(rename_all = "snake_case")]
async fn create_fake_game(
    handle: tauri::AppHandle,
    path: &str,
    executable_name: &str,
    _path_len: i64,
    app_id: i64,
    display_name: Option<String>,
) -> Result<String, String> {
    // Must create in the same directory as the executable to avoid permission issues
    let game_folder_path = game_folder_path(path, app_id);

    println!("Game folder path: {:?}", game_folder_path);
    println!(
        "Game full path: {:?}",
        game_folder_path.join(executable_name)
    );

    match fs::create_dir_all(&game_folder_path) {
        Ok(_) => {
            println!("Successfully created directory: {:?}", game_folder_path);
        }
        Err(e) => return Err(format!("Failed to create game folder: {}", e)),
    };

    let resource_path = resolve_runner_template(&handle)?;
    println!("Creating dummy game executable from: {:?}", resource_path);

    if is_app_bundle(executable_name) {
        let app_bundle_path = game_folder_path.join(executable_name);
        let bundle_display_name = display_name
            .filter(|name| !name.is_empty())
            .unwrap_or_else(|| bundle_binary_name(executable_name));
        let target_executable_path = make_macos_app_bundle(
            &app_bundle_path,
            executable_name,
            &bundle_display_name,
            &resource_path,
        )?;
        return Ok(format!(
            "Dummy app bundle created at: {:?}",
            target_executable_path
        ));
    }

    let target_executable_path = game_folder_path.join(executable_name);
    match fs::copy(&resource_path, &target_executable_path) {
        Ok(_) => {
            #[cfg(unix)]
            {
                use std::os::unix::fs::PermissionsExt;
                let mut perms = std::fs::metadata(&target_executable_path)
                    .map_err(|e| format!("Failed to get file metadata: {}", e))?
                    .permissions();
                perms.set_mode(0o755);
                std::fs::set_permissions(&target_executable_path, perms)
                    .map_err(|e| format!("Failed to set executable permissions: {}", e))?;
            }

            Ok(format!(
                "Dummy executable copied to: {:?}",
                target_executable_path
            ))
        }
        Err(e) => Err(format!("Failed to copy dummy executable: {}", e)),
    }
}

#[cfg(target_os = "macos")]
fn launch_macos_app_bundle(app_bundle_path: &Path, title: &str) -> Result<(), String> {
    let mut command = std::process::Command::new("open");
    command
        .arg("-n")
        .arg("-g")
        .arg("-a")
        .arg(app_bundle_path)
        .arg("--args")
        .arg("--title")
        .arg(title);

    command
        .spawn()
        .map_err(|e| format!("Failed to launch app bundle with open: {}", e))?;

    Ok(())
}

#[tauri::command(rename_all = "snake_case")]
async fn run_background_process(
    name: &str,
    path: &str,
    executable_name: &str,
    _path_len: i64,
    app_id: i64,
) -> Result<String, String> {
    let game_folder_path = game_folder_path(path, app_id);

    if is_app_bundle(executable_name) {
        #[cfg(target_os = "macos")]
        {
            let bundle_path = game_folder_path.join(executable_name);
            launch_macos_app_bundle(&bundle_path, name)?;
            return Ok("App bundle launched successfully".to_string());
        }

        #[cfg(not(target_os = "macos"))]
        {
            let _ = name;
            return Err("App bundle launches are only supported on macOS".to_string());
        }
    }

    let executable_path = launch_executable_path(&game_folder_path, executable_name);
    
    let mut cmd = std::process::Command::new(&executable_path);
    cmd.args(["--title", name])
       .current_dir(game_folder_path);
    
    // Platform-specific process spawning
    #[cfg(target_os = "windows")]
    {
        use std::os::windows::process::CommandExt;
        const CREATE_NO_WINDOW: u32 = 0x08000000;
        cmd.creation_flags(CREATE_NO_WINDOW);
    }

    #[cfg(unix)]
    {
        use std::os::unix::process::CommandExt;
        cmd.process_group(0); // Create new process group on Unix
    }
    
    match cmd.spawn() {
        Ok(_) => Ok("Process started successfully".to_string()),
        Err(e) => Err(format!("Failed to start process: {}", e)),
    }
}

#[tauri::command(rename_all = "snake_case")]
async fn stop_process(exec_name: String) -> Result<(), String> {
    let process_name = stop_process_name(&exec_name);

    #[cfg(target_os = "windows")]
    {
        use std::os::windows::process::CommandExt;
        const CREATE_NO_WINDOW: u32 = 0x08000000;

        let output = std::process::Command::new("taskkill")
            .creation_flags(CREATE_NO_WINDOW)
            .arg("/F")
            .arg("/IM")
            .arg(&process_name)
            .output()
            .map_err(|e| format!("Failed to execute taskkill: {}", e))?;

        if output.status.success() {
            Ok(())
        } else {
            // If the process was already terminated or not found, it is still considered stopped
            Ok(())
        }
    }

    #[cfg(target_os = "macos")]
    {
        if is_app_bundle(&exec_name) {
            let bundle_pattern = format!("{}/Contents/MacOS", exec_name);
            let output = std::process::Command::new("pkill")
                .arg("-f")
                .arg(&bundle_pattern)
                .output()
                .map_err(|e| format!("Failed to execute pkill: {}", e))?;

            if output.status.success() {
                return Ok(());
            }
        }

        let output = std::process::Command::new("pkill")
            .arg("-x")
            .arg(&process_name)
            .output()
            .map_err(|e| format!("Failed to execute pkill: {}", e))?;

        if output.status.success() || output.status.code() == Some(1) {
            Ok(())
        } else {
            Err(format!(
                "Failed to stop process: {}",
                String::from_utf8_lossy(&output.stderr)
            ))
        }
    }
    #[cfg(target_os = "linux")]
    {
        let output = std::process::Command::new("pkill")
            .arg("-f")
            .arg(&exec_name)
            .output()
            .map_err(|e| format!("Failed to execute pkill: {}", e))?;

        if output.status.success() || output.status.code() == Some(1) {
            // pkill returns 1 if no processes were killed, which is fine
            Ok(())
        } else {
            Err(format!(
                "Failed to stop process: {}",
                String::from_utf8_lossy(&output.stderr)
            ))
        }
    }
}

/// Usage: Calling from JS:
/// ```javascript
/// await invoke('connect_to_discord_rpc_3', json, 'connect' | 'disconnect');
#[tauri::command(rename_all = "snake_case")]
async fn connect_to_discord_rpc_3(
    handle: AppHandle,
    activity_json: String,
    _action: String,
    target_clients: Option<Vec<String>>,
) -> Result<Vec<String>, String> {
    let event_connecting = "client_connecting";
    let event_connected = "client_connected";
    let event_disconnect = "event_disconnect";

    let activity = match runner::parse_activity_json(&activity_json) {
        Ok(a) => a,
        Err(e) => {
            eprintln!("Failed to parse activity: {}", e);
            return Err(format!("Failed to parse activity: {}", e));
        }
    };

    let app_id = activity.app_id.clone();
    let targets = target_clients.unwrap_or_default();

    let connecting_payload = serde_json::json!({
        "app_id": app_id,
    });

    {
        let mut client_guard = get_discord_client().lock().unwrap();
        client_guard.take();
    }

    handle
        .emit(event_connecting, connecting_payload)
        .unwrap_or_else(|e| eprintln!("Failed to emit event: {}", e));

    let mut act_map = serde_json::Map::new();
    if let Some(details) = &activity.details {
        act_map.insert("details".to_string(), serde_json::json!(details));
    }
    if let Some(state) = &activity.state {
        act_map.insert("state".to_string(), serde_json::json!(state));
    }
    if let Some(ts) = activity.timestamp {
        act_map.insert("timestamps".to_string(), serde_json::json!({ "start": ts }));
    }
    let act_kind = activity.activity_kind.unwrap_or(0);
    act_map.insert("type".to_string(), serde_json::json!(act_kind));

    if let Some(key) = &activity.large_image_key {
        let mut assets = serde_json::Map::new();
        assets.insert("large_image".to_string(), serde_json::json!(key));
        if let Some(txt) = &activity.large_image_text {
            assets.insert("large_text".to_string(), serde_json::json!(txt));
        }
        act_map.insert("assets".to_string(), serde_json::Value::Object(assets));
    }

    let activity_val = serde_json::Value::Object(act_map);

    let connected_clients = multi_ipc::set_multi_activity(&app_id, activity_val, &targets).await;

    if !connected_clients.is_empty() {
        let connected_payload = serde_json::json!({
            "app_id": app_id,
            "active_clients": connected_clients,
        });

        handle
            .emit(event_connected, connected_payload)
            .unwrap_or_else(|e| eprintln!("Failed to emit event: {}", e));

        handle.listen(event_disconnect, move |_| {
            println!("Disconnecting from Discord RPC (multi_ipc)");
            let _ = tauri::async_runtime::spawn(async move {
                multi_ipc::disconnect_all().await;
            });
        });

        Ok(connected_clients)
    } else {
        // Fallback to discord-sdk
        match runner::set_activity(activity_json).await {
            Ok(client) => {
                let st = check_discord_clients();
                let mut running_targets = Vec::new();
                if targets.is_empty() {
                    if st.stable { running_targets.push("Stable".to_string()); }
                    if st.ptb { running_targets.push("PTB".to_string()); }
                    if st.canary { running_targets.push("Canary".to_string()); }
                } else {
                    for t in &targets {
                        let tl = t.to_lowercase();
                        if (tl == "stable" && st.stable)
                            || (tl == "ptb" && st.ptb)
                            || (tl == "canary" && st.canary)
                        {
                            running_targets.push(t.clone());
                        }
                    }
                }
                if running_targets.is_empty() {
                    if st.stable { running_targets.push("Stable".to_string()); }
                    else if st.ptb { running_targets.push("PTB".to_string()); }
                    else if st.canary { running_targets.push("Canary".to_string()); }
                }

                let connected_payload = serde_json::json!({
                    "app_id": app_id,
                    "active_clients": running_targets,
                });

                {
                    let mut client_guard = get_discord_client().lock().unwrap();
                    *client_guard = Some(client);
                }

                handle
                    .emit(event_connected, connected_payload)
                    .unwrap_or_else(|e| eprintln!("Failed to emit event: {}", e));

                handle.listen(event_disconnect, move |_| {
                    let _ = tauri::async_runtime::spawn(async move {
                        multi_ipc::disconnect_all().await;
                        let client_opt = {
                            let mut client_guard = get_discord_client().lock().unwrap();
                            client_guard.take()
                        };
                        if let Some(client) = client_opt {
                            client.discord.disconnect().await;
                        }
                    });
                });

                Ok(running_targets)
            }
            Err(e) => {
                eprintln!("Failed to set activity: {}", e);
                let error_payload = serde_json::json!({
                    "app_id": app_id,
                    "error": e,
                });
                let _ = handle.emit("client_error", error_payload);
                Err(format!("Failed to set activity: {}", e))
            }
        }
    }
}

#[tauri::command(rename_all = "snake_case")]
async fn fetch_gamelist_gh_mirror() -> tauri::ipc::Response {
    let res = tauri_plugin_http::reqwest::get("https://markterence.github.io/discord-quest-completer/detectable.json").await;
    tauri::ipc::Response::new(res.unwrap().text().await.unwrap())
}

#[tauri::command(rename_all = "snake_case")]
async fn fetch_gamelist_from_discord() -> tauri::ipc::Response {
    let res = tauri_plugin_http::reqwest::get("https://discord.com/api/applications/detectable").await;
    tauri::ipc::Response::new(res.unwrap().text().await.unwrap())
}

#[tauri::command(rename_all = "snake_case")]
async fn fetch_discord_quest(quest_id: String) -> Result<String, String> {
    let url = format!("https://discord.com/api/v9/quests/{}", quest_id.trim());
    let client = tauri_plugin_http::reqwest::Client::builder()
        .user_agent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")
        .build()
        .map_err(|e| format!("Failed to initialize HTTP client: {}", e))?;

    let res = client
        .get(&url)
        .send()
        .await
        .map_err(|e| format!("Network request failed: {}", e))?;

    if !res.status().is_success() {
        return Err(format!("Discord Quest not found or unavailable (HTTP {})", res.status()));
    }

    res.text().await.map_err(|e| format!("Failed to read response body: {}", e))
}

#[tauri::command(rename_all = "snake_case")]
async fn fetch_discord_application(app_id: String) -> Result<String, String> {
    let url = format!("https://discord.com/api/v9/applications/{}/rpc", app_id.trim());
    let client = tauri_plugin_http::reqwest::Client::builder()
        .user_agent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")
        .build()
        .map_err(|e| format!("Failed to initialize HTTP client: {}", e))?;

    let res = client
        .get(&url)
        .send()
        .await
        .map_err(|e| format!("Network request failed: {}", e))?;

    if !res.status().is_success() {
        return Err(format!("Discord Application not found (HTTP {})", res.status()));
    }

    res.text().await.map_err(|e| format!("Failed to read response body: {}", e))
}

#[tauri::command(rename_all = "snake_case")]
async fn fetch_steam_game_icon(game_name: String) -> Result<String, String> {
    let client = tauri_plugin_http::reqwest::Client::builder()
        .user_agent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")
        .build()
        .map_err(|e| format!("Failed to initialize HTTP client: {}", e))?;

    let res = client
        .get("https://store.steampowered.com/api/storesearch/")
        .query(&[("term", game_name.trim()), ("l", "english"), ("cc", "US")])
        .send()
        .await
        .map_err(|e| format!("Network request failed: {}", e))?;

    if !res.status().is_success() {
        return Err(format!("Steam search failed (HTTP {})", res.status()));
    }

    res.text().await.map_err(|e| format!("Failed to read response body: {}", e))
}

#[derive(serde::Serialize)]
pub struct GamesFolderStats {
    pub count: usize,
    pub total_size_bytes: u64,
    pub path: String,
}

fn dir_size_and_count(dir: &Path) -> (usize, u64) {
    let mut count = 0;
    let mut total_size = 0;
    if let Ok(entries) = fs::read_dir(dir) {
        for entry in entries.flatten() {
            let path = entry.path();
            if path.is_dir() {
                let (sub_count, sub_size) = dir_size_and_count(&path);
                count += sub_count;
                total_size += sub_size;
            } else if path.is_file() {
                count += 1;
                if let Ok(meta) = entry.metadata() {
                    total_size += meta.len();
                }
            }
        }
    }
    (count, total_size)
}

#[tauri::command(rename_all = "snake_case")]
async fn get_games_folder_stats() -> Result<GamesFolderStats, String> {
    let games_dir = get_base_games_dir();
    if !games_dir.exists() {
        let _ = fs::create_dir_all(&games_dir);
    }
    let (count, total_size) = dir_size_and_count(&games_dir);
    Ok(GamesFolderStats {
        count,
        total_size_bytes: total_size,
        path: games_dir.to_string_lossy().to_string(),
    })
}

#[tauri::command(rename_all = "snake_case")]
async fn open_games_folder() -> Result<String, String> {
    let games_dir = get_base_games_dir();
    if !games_dir.exists() {
        fs::create_dir_all(&games_dir).map_err(|e| format!("Failed to create games folder: {}", e))?;
    }

    #[cfg(target_os = "windows")]
    {
        std::process::Command::new("explorer")
            .arg(&games_dir)
            .spawn()
            .map_err(|e| format!("Failed to open Explorer: {}", e))?;
    }

    #[cfg(target_os = "macos")]
    {
        std::process::Command::new("open")
            .arg(&games_dir)
            .spawn()
            .map_err(|e| format!("Failed to open folder: {}", e))?;
    }

    #[cfg(target_os = "linux")]
    {
        std::process::Command::new("xdg-open")
            .arg(&games_dir)
            .spawn()
            .map_err(|e| format!("Failed to open folder: {}", e))?;
    }

    Ok(games_dir.to_string_lossy().to_string())
}

#[tauri::command(rename_all = "snake_case")]
async fn clear_games_folder() -> Result<usize, String> {
    let games_dir = get_base_games_dir();
    let mut removed = 0;

    if games_dir.exists() {
        if let Ok(entries) = fs::read_dir(&games_dir) {
            for entry in entries.flatten() {
                let path = entry.path();
                if path.is_dir() {
                    if fs::remove_dir_all(&path).is_ok() {
                        removed += 1;
                    }
                } else if path.is_file() {
                    if fs::remove_file(&path).is_ok() {
                        removed += 1;
                    }
                }
            }
        }
    }

    // Also clean up any legacy games directory next to executable if it exists
    let exe_path: PathBuf = env::current_exe().unwrap_or_default();
    if let Some(exe_dir) = exe_path.parent() {
        let legacy_dir = exe_dir.join("games");
        if legacy_dir.exists() && legacy_dir != games_dir {
            let _ = fs::remove_dir_all(&legacy_dir);
        }
    }

    Ok(removed)
}

#[derive(serde::Serialize, serde::Deserialize, Default, Clone, Debug)]
pub struct DiscordClientsStatus {
    pub stable: bool,
    pub ptb: bool,
    pub canary: bool,
}

#[tauri::command(rename_all = "snake_case")]
fn check_discord_clients() -> DiscordClientsStatus {
    let mut status = DiscordClientsStatus::default();

    #[cfg(target_os = "windows")]
    {
        use std::os::windows::process::CommandExt;
        const CREATE_NO_WINDOW: u32 = 0x08000000;
        if let Ok(output) = std::process::Command::new("tasklist")
            .args(["/FI", "IMAGENAME eq Discord*", "/FO", "CSV", "/NH"])
            .creation_flags(CREATE_NO_WINDOW)
            .output()
        {
            let text = String::from_utf8_lossy(&output.stdout).to_lowercase();
            status.stable = text.contains("\"discord.exe\"");
            status.ptb = text.contains("\"discordptb.exe\"");
            status.canary = text.contains("\"discordcanary.exe\"");
        }
    }

    #[cfg(target_os = "macos")]
    {
        if let Ok(output) = std::process::Command::new("pgrep")
            .arg("-l")
            .arg("-i")
            .arg("discord")
            .output()
        {
            let text = String::from_utf8_lossy(&output.stdout).to_lowercase();
            status.canary = text.contains("canary");
            status.ptb = text.contains("ptb");
            status.stable = (text.contains("discord.app") || text.contains("discord")) && !status.canary && !status.ptb;
        }
    }

    #[cfg(target_os = "linux")]
    {
        if let Ok(output) = std::process::Command::new("pgrep")
            .arg("-a")
            .arg("-i")
            .arg("discord")
            .output()
        {
            let text = String::from_utf8_lossy(&output.stdout).to_lowercase();
            status.canary = text.contains("canary");
            status.ptb = text.contains("ptb");
            status.stable = text.contains("discord") && !status.canary && !status.ptb;
        }
    }

    status
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            greet,
            create_fake_game,
            stop_process,
            connect_to_discord_rpc_3,
            run_background_process,
            fetch_gamelist_gh_mirror,
            fetch_gamelist_from_discord,
            fetch_discord_quest,
            fetch_discord_application,
            fetch_steam_game_icon,
            get_games_folder_stats,
            open_games_folder,
            clear_games_folder,
            check_discord_clients
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}