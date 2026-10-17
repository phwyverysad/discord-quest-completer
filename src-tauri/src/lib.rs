use once_cell::sync::{Lazy, OnceCell};
use std::collections::HashSet;
use std::env;
use std::fs;
use std::path::{Path, PathBuf};
use std::sync::Mutex;
use tauri::{path::BaseDirectory, AppHandle, Emitter, Manager};

mod multi_ipc;
mod rpc;
mod runner;

static ACTIVE_PROCESSES: Lazy<Mutex<HashSet<String>>> = Lazy::new(|| Mutex::new(HashSet::new()));

// Global static instance of the Discord client
static DISCORD_CLIENT: OnceCell<Mutex<Option<rpc::Client>>> = OnceCell::new();

fn get_discord_client() -> &'static Mutex<Option<rpc::Client>> {
    DISCORD_CLIENT.get_or_init(|| Mutex::new(None))
}

fn runner_resource_name() -> &'static str {
    #[cfg(target_os = "windows")]
    let runner_name = "resources/src-win.exe";

    #[cfg(target_os = "linux")]
    let runner_name = "resources/src-linux";

    #[cfg(target_os = "macos")]
    let runner_name = "resources/src-darwin";

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
    if let Ok(exe_path) = env::current_exe() {
        if let Some(exe_dir) = exe_path.parent() {
            let local_games = exe_dir.join("games");
            if local_games.exists() || fs::create_dir_all(&local_games).is_ok() {
                return local_games;
            }
        }
    }

    #[cfg(target_os = "windows")]
    if let Ok(local_app_data) = env::var("LOCALAPPDATA") {
        let app_games = PathBuf::from(local_app_data)
            .join("discord-quest-completer")
            .join("games");
        if fs::create_dir_all(&app_games).is_ok() {
            return app_games;
        }
    }

    env::temp_dir().join("discord-quest-completer").join("games")
}

fn parse_app_id_string(app_id: &serde_json::Value) -> String {
    match app_id {
        serde_json::Value::String(s) => s.trim().to_string(),
        serde_json::Value::Number(n) => n.to_string(),
        _ => "0".to_string(),
    }
}

fn game_folder_path(path: &str, app_id: &str) -> PathBuf {
    let normalized_path = Path::new(path).to_string_lossy().to_string();

    get_base_games_dir()
        .join(app_id)
        .join(normalized_path)
}

fn resolve_runner_template(handle: &AppHandle) -> Result<PathBuf, String> {
    let candidates = [
        runner_resource_name(),
        "resources/src-win.exe",
        "data/src-win.exe",
        "src-win.exe",
    ];

    for rel in candidates {
        if let Ok(path) = handle.path().resolve(rel, BaseDirectory::Resource) {
            if path.exists() {
                return Ok(path);
            }
        }
    }

    if let Ok(exe_path) = env::current_exe() {
        if let Some(exe_dir) = exe_path.parent() {
            let local_res = exe_dir.join("resources").join("src-win.exe");
            if local_res.exists() {
                return Ok(local_res);
            }
            let local_data = exe_dir.join("data").join("src-win.exe");
            if local_data.exists() {
                return Ok(local_data);
            }
        }
    }

    let dev_res = PathBuf::from("resources/src-win.exe");
    if dev_res.exists() {
        return Ok(dev_res);
    }

    let dev_target = PathBuf::from("../src-win/target/release/src-win.exe");
    if dev_target.exists() {
        return Ok(dev_target);
    }

    Err("Failed to resolve runner template executable".to_string())
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

fn convert_png_to_ico(png_bytes: &[u8]) -> Vec<u8> {
    let mut ico = Vec::with_capacity(22 + png_bytes.len());
    // ICONDIR: reserved=0, type=1 (ICO), count=1
    ico.extend_from_slice(&[0, 0, 1, 0, 1, 0]);
    // ICONDIRENTRY (16 bytes):
    ico.push(0); // width (0 = 256 or auto)
    ico.push(0); // height (0 = 256 or auto)
    ico.push(0); // color count
    ico.push(0); // reserved
    ico.extend_from_slice(&1u16.to_le_bytes()); // planes (1)
    ico.extend_from_slice(&32u16.to_le_bytes()); // bpp (32)
    ico.extend_from_slice(&(png_bytes.len() as u32).to_le_bytes()); // size
    ico.extend_from_slice(&22u32.to_le_bytes()); // offset (22)
    ico.extend_from_slice(png_bytes);
    ico
}

async fn prepare_game_icon(game_folder: &Path, icon_url: Option<&str>) -> Option<PathBuf> {
    let icon_path = game_folder.join("game_icon.ico");
    if icon_path.exists() && fs::metadata(&icon_path).map(|m| m.len() > 0).unwrap_or(false) {
        return Some(icon_path);
    }

    if let Some(url) = icon_url {
        if !url.trim().is_empty() {
            let client = tauri_plugin_http::reqwest::Client::builder()
                .user_agent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")
                .build()
                .ok();
            if let Some(c) = client {
                if let Ok(resp) = c.get(url.trim()).send().await {
                    if resp.status().is_success() {
                        if let Ok(bytes) = resp.bytes().await {
                            if !bytes.is_empty() {
                                let is_already_ico = bytes.starts_with(&[0, 0, 1, 0]);
                                let final_bytes = if is_already_ico {
                                    bytes.to_vec()
                                } else {
                                    convert_png_to_ico(&bytes)
                                };
                                let _ = fs::write(&icon_path, final_bytes);
                                if icon_path.exists() {
                                    return Some(icon_path);
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    if icon_path.exists() {
        Some(icon_path)
    } else {
        None
    }
}

#[tauri::command(rename_all = "snake_case")]
async fn create_fake_game(
    handle: tauri::AppHandle,
    path: &str,
    executable_name: &str,
    _path_len: i64,
    app_id: serde_json::Value,
    display_name: Option<String>,
    icon_url: Option<String>,
) -> Result<String, String> {
    let app_id_str = parse_app_id_string(&app_id);
    let game_folder_path = game_folder_path(path, &app_id_str);

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

    // Pre-download game icon to game folder if available
    let _ = prepare_game_icon(&game_folder_path, icon_url.as_deref()).await;

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
    handle: tauri::AppHandle,
    name: &str,
    path: &str,
    executable_name: &str,
    _path_len: i64,
    app_id: serde_json::Value,
    icon_url: Option<String>,
) -> Result<String, String> {
    let app_id_str = parse_app_id_string(&app_id);
    let game_folder_path = game_folder_path(path, &app_id_str);

    let icon_file = prepare_game_icon(&game_folder_path, icon_url.as_deref()).await;

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
    
    // Automatically prepare or update dummy executable if missing or outdated
    if let Ok(_) = fs::create_dir_all(&game_folder_path) {
        if let Ok(resource_path) = resolve_runner_template(&handle) {
            let needs_copy = match fs::metadata(&executable_path) {
                Ok(meta) => match fs::metadata(&resource_path) {
                    Ok(res_meta) => meta.len() != res_meta.len(),
                    Err(_) => false,
                },
                Err(_) => true,
            };
            if needs_copy {
                let _ = fs::copy(&resource_path, &executable_path);
            }
        }
    }

    let mut cmd = std::process::Command::new(&executable_path);
    cmd.args(["--title", name]);
    if let Some(ref ico) = icon_file {
        cmd.args(["--icon", &ico.to_string_lossy()]);
    }
    cmd.current_dir(&game_folder_path);
    

    // Platform-specific process spawning
    #[cfg(unix)]
    {
        use std::os::unix::process::CommandExt;
        cmd.process_group(0); // Create new process group on Unix
    }
    
    match cmd.spawn() {
        Ok(_) => {
            if let Ok(mut set) = ACTIVE_PROCESSES.lock() {
                set.insert(executable_name.to_string());
            }
            Ok("Process started successfully".to_string())
        }
        Err(e) => Err(format!("Failed to start process: {}", e)),
    }
}

pub fn terminate_all_background_processes() {
    let procs = {
        if let Ok(mut set) = ACTIVE_PROCESSES.lock() {
            let items: Vec<String> = set.drain().collect();
            items
        } else {
            Vec::new()
        }
    };

    for exec_name in procs {
        let process_name = stop_process_name(&exec_name);
        #[cfg(target_os = "windows")]
        {
            use std::os::windows::process::CommandExt;
            const CREATE_NO_WINDOW: u32 = 0x08000000;
            let _ = std::process::Command::new("taskkill")
                .creation_flags(CREATE_NO_WINDOW)
                .arg("/F")
                .arg("/IM")
                .arg(&process_name)
                .output();
        }
        #[cfg(target_os = "macos")]
        {
            if is_app_bundle(&exec_name) {
                let bundle_pattern = format!("{}/Contents/MacOS", exec_name);
                let _ = std::process::Command::new("pkill")
                    .arg("-f")
                    .arg(&bundle_pattern)
                    .output();
            }
            let _ = std::process::Command::new("pkill")
                .arg("-x")
                .arg(&process_name)
                .output();
        }
        #[cfg(target_os = "linux")]
        {
            let _ = std::process::Command::new("pkill")
                .arg("-f")
                .arg(&exec_name)
                .output();
        }
    }
}

#[tauri::command(rename_all = "snake_case")]
async fn stop_all_processes() -> Result<(), String> {
    terminate_all_background_processes();
    Ok(())
}

#[tauri::command(rename_all = "snake_case")]
async fn stop_process(exec_name: String) -> Result<(), String> {
    if let Ok(mut set) = ACTIVE_PROCESSES.lock() {
        set.remove(&exec_name);
    }
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
/// await invoke('connect_to_discord_rpc_3', { activity_json, action: 'connect' | 'disconnect' });
/// ```
#[tauri::command(rename_all = "snake_case")]
async fn connect_to_discord_rpc_3(
    handle: AppHandle,
    activity_json: String,
    _action: String,
    target_clients: Option<Vec<String>>,
) -> Result<Vec<String>, String> {
    let event_connecting = "client_connecting";
    let event_connected = "client_connected";

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

    handle
        .emit(event_connecting, connecting_payload)
        .unwrap_or_else(|e| eprintln!("Failed to emit event: {}", e));

    let mut act_map = serde_json::Map::new();
    if let Some(details) = &activity.details {
        if !details.is_empty() {
            act_map.insert("details".to_string(), serde_json::Value::String(details.clone()));
        }
    }
    if let Some(state) = &activity.state {
        if !state.is_empty() {
            act_map.insert("state".to_string(), serde_json::Value::String(state.clone()));
        }
    }
    if let Some(ts) = activity.timestamp {
        let mut timestamps = serde_json::Map::new();
        timestamps.insert("start".to_string(), serde_json::Value::Number(ts.into()));
        act_map.insert("timestamps".to_string(), serde_json::Value::Object(timestamps));
    }
    if let Some(img_key) = &activity.large_image_key {
        if !img_key.is_empty() {
            let mut assets = serde_json::Map::new();
            assets.insert("large_image".to_string(), serde_json::Value::String(img_key.clone()));
            if let Some(img_text) = &activity.large_image_text {
                assets.insert("large_text".to_string(), serde_json::Value::String(img_text.clone()));
            }
            act_map.insert("assets".to_string(), serde_json::Value::Object(assets));
        }
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

        Ok(connected_clients)
    } else {
        // Fallback to discord-sdk
        match runner::set_activity(activity_json).await {
            Ok(client) => {
                let connected_payload = serde_json::json!({
                    "app_id": app_id,
                    "active_clients": vec!["Discord"],
                });

                {
                    let mut client_guard = get_discord_client().lock().unwrap();
                    *client_guard = Some(client);
                }

                handle
                    .emit(event_connected, connected_payload)
                    .unwrap_or_else(|e| eprintln!("Failed to emit event: {}", e));

                Ok(vec!["Discord".to_string()])
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
async fn disconnect_discord_rpc(handle: AppHandle) -> Result<(), String> {
    multi_ipc::disconnect_all().await;
    let client_option = {
        let mut client_guard = get_discord_client().lock().unwrap();
        client_guard.take()
    };
    if let Some(client) = client_option {
        let _ = client.discord.disconnect().await;
    }
    let _ = handle.emit("event_disconnect", ());
    Ok(())
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
        .on_window_event(|_window, event| {
            if let tauri::WindowEvent::Destroyed = event {
                terminate_all_background_processes();
                tauri::async_runtime::spawn(async {
                    multi_ipc::disconnect_all().await;
                });
            }
        })
        .invoke_handler(tauri::generate_handler![
            greet,
            create_fake_game,
            stop_process,
            stop_all_processes,
            connect_to_discord_rpc_3,
            disconnect_discord_rpc,
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

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_discord_rpc() {
        let payload = serde_json::json!({
            "app_id": "1402418087793528862",
            "details": "Playing Risk of Rain 2",
            "state": "In Game",
            "timestamp": 1729000000
        });
        println!("Testing set_activity with Discord...");
        match runner::set_activity(payload.to_string()).await {
            Ok(_client) => {
                println!("SUCCESSFULLY CONNECTED TO DISCORD RPC AND SET ACTIVITY!");
                tokio::time::sleep(tokio::time::Duration::from_secs(3)).await;
            }
            Err(e) => {
                println!("FAILED TO SET ACTIVITY: {}", e);
            }
        }
    }
}