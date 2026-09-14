use once_cell::sync::OnceCell;
use serde_json::Value;
use std::sync::Mutex;
use std::time::Duration;

#[cfg(target_os = "windows")]
use tokio::io::{split, AsyncReadExt, AsyncWriteExt, WriteHalf};
#[cfg(target_os = "windows")]
use tokio::net::windows::named_pipe::{ClientOptions, NamedPipeClient};

#[allow(dead_code)]
pub struct ActivePipe {
    pub client_name: String,
    pub pipe_idx: u32,
    #[cfg(target_os = "windows")]
    pub writer: WriteHalf<NamedPipeClient>,
}

static ACTIVE_PIPES: OnceCell<Mutex<Vec<ActivePipe>>> = OnceCell::new();

fn get_active_pipes() -> &'static Mutex<Vec<ActivePipe>> {
    ACTIVE_PIPES.get_or_init(|| Mutex::new(Vec::new()))
}

pub async fn disconnect_all() {
    #[cfg(target_os = "windows")]
    {
        let pipes = {
            let mut guard = get_active_pipes().lock().unwrap();
            guard.drain(..).collect::<Vec<_>>()
        };

        for mut pipe in pipes {
            let clear_msg = serde_json::json!({
                "cmd": "SET_ACTIVITY",
                "args": {
                    "pid": std::process::id(),
                    "activity": serde_json::Value::Null
                },
                "nonce": "clear"
            })
            .to_string();

            let mut buf = Vec::new();
            buf.extend_from_slice(&1u32.to_le_bytes());
            buf.extend_from_slice(&(clear_msg.len() as u32).to_le_bytes());
            buf.extend_from_slice(clear_msg.as_bytes());
            let _ = tokio::time::timeout(Duration::from_millis(200), pipe.writer.write_all(&buf)).await;
        }
    }
    #[cfg(not(target_os = "windows"))]
    {
        let mut guard = get_active_pipes().lock().unwrap();
        guard.clear();
    }
}

pub async fn set_multi_activity(
    app_id: &str,
    activity_payload: Value,
    targets: &[String],
) -> Vec<String> {
    disconnect_all().await;

    let mut connected_names = Vec::new();

    #[cfg(target_os = "windows")]
    {
        let mut join_handles = Vec::new();

        for pipe_idx in 0..10u32 {
            let app_id = app_id.to_string();
            let act_val = activity_payload.clone();
            let target_list = targets.to_vec();

            join_handles.push(tokio::spawn(async move {
                let socket_path = format!(r"\\.\pipe\discord-ipc-{}", pipe_idx);
                let pipe = match ClientOptions::new().open(&socket_path) {
                    Ok(c) => c,
                    Err(_) => return None,
                };

                let (mut reader, mut writer) = split(pipe);

                // 1. Handshake (Opcode 0)
                let handshake_json = serde_json::json!({
                    "v": 1,
                    "client_id": app_id,
                })
                .to_string();

                let mut h_buf = Vec::new();
                h_buf.extend_from_slice(&0u32.to_le_bytes());
                h_buf.extend_from_slice(&(handshake_json.len() as u32).to_le_bytes());
                h_buf.extend_from_slice(handshake_json.as_bytes());

                if tokio::time::timeout(Duration::from_millis(400), writer.write_all(&h_buf))
                    .await
                    .is_err()
                {
                    return None;
                }

                // Read Handshake response header (8 bytes)
                let mut header = [0u8; 8];
                if tokio::time::timeout(Duration::from_millis(400), reader.read_exact(&mut header))
                    .await
                    .is_err()
                {
                    return None;
                }

                let resp_len =
                    u32::from_le_bytes(header[4..8].try_into().unwrap_or_default()) as usize;
                if resp_len == 0 || resp_len > 65536 {
                    return None;
                }

                let mut resp_buf = vec![0u8; resp_len];
                if tokio::time::timeout(Duration::from_millis(400), reader.read_exact(&mut resp_buf))
                    .await
                    .is_err()
                {
                    return None;
                }

                let resp_str = String::from_utf8_lossy(&resp_buf).to_lowercase();

                // Detect client edition from api_endpoint
                let client_name = if resp_str.contains("canary.discord.com") {
                    "Canary"
                } else if resp_str.contains("ptb.discord.com") {
                    "PTB"
                } else {
                    "Stable"
                };

                // Filter by target list (if targets empty, default to allow all)
                let is_targeted = if target_list.is_empty() {
                    true
                } else {
                    target_list.iter().any(|t| t.eq_ignore_ascii_case(client_name))
                };

                if !is_targeted {
                    return None;
                }

                // 2. Set Activity (Opcode 1)
                let act_msg = serde_json::json!({
                    "cmd": "SET_ACTIVITY",
                    "args": {
                        "pid": std::process::id(),
                        "activity": act_val,
                    },
                    "nonce": format!("nonce-{}", pipe_idx)
                })
                .to_string();

                let mut a_buf = Vec::new();
                a_buf.extend_from_slice(&1u32.to_le_bytes());
                a_buf.extend_from_slice(&(act_msg.len() as u32).to_le_bytes());
                a_buf.extend_from_slice(act_msg.as_bytes());

                if tokio::time::timeout(Duration::from_millis(400), writer.write_all(&a_buf))
                    .await
                    .is_err()
                {
                    return None;
                }

                // Spawn background reader to prevent pipe buffer from stalling
                tokio::spawn(async move {
                    let mut drain_buf = [0u8; 2048];
                    while let Ok(n) = reader.read(&mut drain_buf).await {
                        if n == 0 {
                            break;
                        }
                    }
                });

                Some((client_name.to_string(), pipe_idx, writer))
            }));
        }

        let mut new_pipes = Vec::new();

        for handle in join_handles {
            if let Ok(Some((client_name, pipe_idx, writer))) = handle.await {
                if !connected_names.contains(&client_name) {
                    connected_names.push(client_name.clone());
                }
                new_pipes.push(ActivePipe {
                    client_name,
                    pipe_idx,
                    writer,
                });
            }
        }

        let mut guard = get_active_pipes().lock().unwrap();
        *guard = new_pipes;
    }

    connected_names
}
