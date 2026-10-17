fn main() {
    println!("cargo:rerun-if-changed=src/main.cpp");
    println!("cargo:rerun-if-changed=app.rc");
    println!("cargo:rerun-if-changed=icon.ico");

    let target = std::env::var("TARGET").unwrap();
    if target.contains("windows") {
        cc::Build::new()
            .cpp(true)
            .file("src/main.cpp")
            .flag("/GS-")
            .flag("/O1")
            .compile("runner_cpp");

        let out_dir = std::env::var("OUT_DIR").unwrap();
        let res_path = format!("{}/app.res", out_dir);
        let status = std::process::Command::new("rc.exe")
            .args(["/fo", &res_path, "app.rc"])
            .status();

        if let Ok(s) = status {
            if s.success() {
                println!("cargo:rustc-link-arg={}", res_path);
            }
        }

        println!("cargo:rustc-link-arg=/NODEFAULTLIB");
        println!("cargo:rustc-link-arg=/ENTRY:mainEntryPoint");
        println!("cargo:rustc-link-arg=/SUBSYSTEM:WINDOWS");

        println!("cargo:rustc-link-lib=kernel32");
        println!("cargo:rustc-link-lib=user32");
        println!("cargo:rustc-link-lib=shell32");
        println!("cargo:rustc-link-lib=gdi32");
    }
}