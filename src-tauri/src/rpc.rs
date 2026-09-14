pub use discord_sdk as ds;

/// Application identifier for "Andy's Test App" used in the Discord SDK's
/// examples.
pub struct Client {
    pub discord: ds::Discord,
    #[allow(dead_code)]
    pub wheel: ds::wheel::Wheel,
    #[allow(dead_code)]
    pub user: ds::user::User,
}

pub async fn make_client(app_id: ds::AppId, subs: ds::Subscriptions) -> Result<Client, String> {
    println!("Creating Discord client with app ID: {}", app_id);
    let (wheel, handler) = ds::wheel::Wheel::new(Box::new(|err| {
        println!("Error: {:?}", err);
    }));

    let mut user = wheel.user();

    let discord = ds::Discord::new(ds::DiscordApp::PlainId(app_id), subs, Box::new(handler))
        .map_err(|e| format!("unable to create discord client: {}", e))?;
    
    user.0
        .changed()
        .await
        .map_err(|e| format!("failed waiting for discord connection: {}", e))?;

    let user = match &*user.0.borrow() {
        ds::wheel::UserState::Connected(user) => user.clone(),
        ds::wheel::UserState::Disconnected(err) => {
            return Err(format!("failed to connect to Discord: {}", err));
        }
    };

    println!("connected to Discord, local user is {:#?}", user);

    Ok(Client {
        discord,
        wheel,
        user,
    })
}
