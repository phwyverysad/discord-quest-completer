#include <windows.h>
#include <shellapi.h>

#define WM_TRAY_MESSAGE   (WM_USER + 1)
#define ID_TRAY_EXIT      1003
#define ID_TRAY_TOGGLE    1004
#define TIMER_ID_SEC      1005

typedef BOOL(WINAPI* P_Shell_NotifyIconW)(DWORD, PNOTIFYICONDATAW);
typedef HFONT(WINAPI* P_CreateFontW)(int, int, int, int, int, DWORD, DWORD, DWORD, DWORD, DWORD, DWORD, DWORD, DWORD, LPCWSTR);
typedef BOOL(WINAPI* P_DeleteObject)(HGDIOBJ);
typedef HWND(WINAPI* P_CreateWindowExW)(DWORD, LPCWSTR, LPCWSTR, DWORD, int, int, int, int, HWND, HMENU, HINSTANCE, LPVOID);
typedef UINT_PTR(WINAPI* P_SetTimer)(HWND, UINT_PTR, UINT, TIMERPROC);
typedef BOOL(WINAPI* P_KillTimer)(HWND, UINT_PTR);
typedef BOOL(WINAPI* P_SetWindowTextW)(HWND, LPCWSTR);
typedef COLORREF(WINAPI* P_SetTextColor)(HDC, COLORREF);
typedef HANDLE(WINAPI* P_LoadImageW)(HINSTANCE, LPCWSTR, UINT, int, int, UINT);
typedef BOOL(WINAPI* P_DestroyIcon)(HICON);

P_Shell_NotifyIconW f_Shell_NotifyIconW = NULL;
P_CreateFontW f_CreateFontW = NULL;
P_DeleteObject f_DeleteObject = NULL;
P_CreateWindowExW f_CreateWindowExW = NULL;
P_SetTimer f_SetTimer = NULL;
P_KillTimer f_KillTimer = NULL;
P_SetWindowTextW f_SetWindowTextW = NULL;
P_SetTextColor f_SetTextColor = NULL;
P_LoadImageW f_LoadImageW = NULL;
P_DestroyIcon f_DestroyIcon = NULL;

wchar_t g_szGameName[256] = L"Discord Quest Completer";
wchar_t g_szIconPath[260] = { 0 };
NOTIFYICONDATAW nid = { 0 };
HFONT hFontTitle = NULL, hFontText = NULL;
HWND hTimeText = NULL;
DWORD g_dwSeconds = 0;
HICON g_hIconBig = NULL;
HICON g_hIconSmall = NULL;

wchar_t* FindStringW(const wchar_t* str, const wchar_t* substr) {
    while (*str) {
        const wchar_t* h = str, * n = substr;
        while (*h && *n && *h == *n) { h++; n++; }
        if (!*n) return (wchar_t*)str;
        str++;
    }
    return NULL;
}

void FormatTime(DWORD totalSeconds, wchar_t* outBuf) {
    DWORD hours = totalSeconds / 3600;
    DWORD minutes = (totalSeconds % 3600) / 60;
    DWORD seconds = totalSeconds % 60;

    if (hours > 99) hours = 99;

    outBuf[0] = L'0' + (wchar_t)(hours / 10);
    outBuf[1] = L'0' + (wchar_t)(hours % 10);
    outBuf[2] = L':';
    outBuf[3] = L'0' + (wchar_t)(minutes / 10);
    outBuf[4] = L'0' + (wchar_t)(minutes % 10);
    outBuf[5] = L':';
    outBuf[6] = L'0' + (wchar_t)(seconds / 10);
    outBuf[7] = L'0' + (wchar_t)(seconds % 10);
    outBuf[8] = L'\0';
}

void ToggleWindow(HWND hWnd) {
    if (IsWindowVisible(hWnd)) {
        ShowWindow(hWnd, SW_HIDE);
    }
    else {
        ShowWindow(hWnd, SW_SHOW);
        ShowWindow(hWnd, SW_RESTORE);
        SetForegroundWindow(hWnd);
    }
}

LRESULT CALLBACK WndProc(HWND hWnd, UINT message, WPARAM wParam, LPARAM lParam) {
    switch (message) {
    case WM_CREATE: {
        hFontTitle = f_CreateFontW(24, 0, 0, 0, FW_BOLD, 0, 0, 0, DEFAULT_CHARSET, 0, 0, 0, 0, L"Segoe UI");
        hFontText = f_CreateFontW(34, 0, 0, 0, FW_BOLD, 0, 0, 0, DEFAULT_CHARSET, 0, 0, 0, 0, L"Segoe UI");

        HWND h1 = f_CreateWindowExW(0, L"STATIC", g_szGameName, WS_VISIBLE | WS_CHILD | SS_CENTER, 10, 35, 380, 35, hWnd, NULL, NULL, NULL);
        hTimeText = f_CreateWindowExW(0, L"STATIC", L"00:00:00", WS_VISIBLE | WS_CHILD | SS_CENTER, 10, 85, 380, 45, hWnd, NULL, NULL, NULL);

        SendMessageW(h1, WM_SETFONT, (WPARAM)hFontTitle, TRUE);
        SendMessageW(hTimeText, WM_SETFONT, (WPARAM)hFontText, TRUE);

        if (f_SetTimer) {
            f_SetTimer(hWnd, TIMER_ID_SEC, 1000, NULL);
        }

        nid.cbSize = sizeof(NOTIFYICONDATAW);
        nid.hWnd = hWnd;
        nid.uID = 1;
        nid.uFlags = NIF_ICON | NIF_MESSAGE | NIF_TIP;
        nid.uCallbackMessage = WM_TRAY_MESSAGE;
        nid.hIcon = g_hIconSmall ? g_hIconSmall : LoadIcon(NULL, IDI_APPLICATION);
        lstrcpynW(nid.szTip, g_szGameName, 128);
        f_Shell_NotifyIconW(NIM_ADD, &nid);
    } break;

    case WM_TIMER: {
        if (wParam == TIMER_ID_SEC) {
            g_dwSeconds++;
            wchar_t szTime[16];
            FormatTime(g_dwSeconds, szTime);
            if (f_SetWindowTextW && hTimeText) {
                f_SetWindowTextW(hTimeText, szTime);
            }
        }
    } break;

    case WM_TRAY_MESSAGE:
        if (lParam == WM_RBUTTONUP) {
            POINT cur; GetCursorPos(&cur);
            HMENU hMenu = CreatePopupMenu();
            InsertMenuW(hMenu, 0, MF_BYPOSITION | MF_STRING, ID_TRAY_TOGGLE, IsWindowVisible(hWnd) ? L"Hide" : L"Show");
            InsertMenuW(hMenu, 2, MF_SEPARATOR, 0, NULL);
            InsertMenuW(hMenu, 3, MF_BYPOSITION | MF_STRING, ID_TRAY_EXIT, L"Exit");
            SetForegroundWindow(hWnd);
            TrackPopupMenu(hMenu, TPM_BOTTOMALIGN | TPM_LEFTALIGN, cur.x, cur.y, 0, hWnd, NULL);
            DestroyMenu(hMenu);
        }
        else if (lParam == WM_LBUTTONDBLCLK) ToggleWindow(hWnd);
        break;

    case WM_COMMAND:
        if (LOWORD(wParam) == ID_TRAY_EXIT) DestroyWindow(hWnd);
        if (LOWORD(wParam) == ID_TRAY_TOGGLE) ToggleWindow(hWnd);
        break;

    case WM_CTLCOLORSTATIC: {
        HDC hdc = (HDC)wParam;
        SetBkMode(hdc, TRANSPARENT);
        if ((HWND)lParam == hTimeText && f_SetTextColor) {
            f_SetTextColor(hdc, RGB(37, 99, 235)); // Vibrant modern blue
        } else if (f_SetTextColor) {
            f_SetTextColor(hdc, RGB(15, 23, 42)); // Deep charcoal / slate
        }
        return (LRESULT)GetStockObject(WHITE_BRUSH);
    }

    case WM_DESTROY:
        if (f_KillTimer) {
            f_KillTimer(hWnd, TIMER_ID_SEC);
        }
        f_Shell_NotifyIconW(NIM_DELETE, &nid);
        if (hFontTitle) f_DeleteObject(hFontTitle);
        if (hFontText) f_DeleteObject(hFontText);
        if (g_hIconBig && f_DestroyIcon) f_DestroyIcon(g_hIconBig);
        if (g_hIconSmall && f_DestroyIcon) f_DestroyIcon(g_hIconSmall);
        PostQuitMessage(0);
        break;

    default: return DefWindowProcW(hWnd, message, wParam, lParam);
    }
    return 0;
}

extern "C" {
    #pragma function(memset)
    void* memset(void* dest, int c, size_t count) {
        char* bytes = (char*)dest;
        while (count--) {
            *bytes++ = (char)c;
        }
        return dest;
    }
}

extern "C" void mainEntryPoint() {
    HINSTANCE hInst = GetModuleHandleW(NULL);

    HMODULE hShell32 = LoadLibraryW(L"shell32.dll");
    HMODULE hGdi32 = LoadLibraryW(L"gdi32.dll");
    HMODULE hUser32 = LoadLibraryW(L"user32.dll");

    f_Shell_NotifyIconW = (P_Shell_NotifyIconW)GetProcAddress(hShell32, "Shell_NotifyIconW");
    f_CreateFontW = (P_CreateFontW)GetProcAddress(hGdi32, "CreateFontW");
    f_DeleteObject = (P_DeleteObject)GetProcAddress(hGdi32, "DeleteObject");
    f_SetTextColor = (P_SetTextColor)GetProcAddress(hGdi32, "SetTextColor");
    f_CreateWindowExW = (P_CreateWindowExW)GetProcAddress(hUser32, "CreateWindowExW");
    f_SetTimer = (P_SetTimer)GetProcAddress(hUser32, "SetTimer");
    f_KillTimer = (P_KillTimer)GetProcAddress(hUser32, "KillTimer");
    f_SetWindowTextW = (P_SetWindowTextW)GetProcAddress(hUser32, "SetWindowTextW");
    f_LoadImageW = (P_LoadImageW)GetProcAddress(hUser32, "LoadImageW");
    f_DestroyIcon = (P_DestroyIcon)GetProcAddress(hUser32, "DestroyIcon");

    LPWSTR lpCmdLine = GetCommandLineW();

    // 1. Parse --title <name>
    const wchar_t* flag = L"--title";
    wchar_t* pos = FindStringW(lpCmdLine, flag);
    if (pos) {
        pos += 7;
        while (*pos == L' ') pos++;

        if (*pos == L'"') {
            pos++; 
            int i = 0;
            while (*pos != L'"' && *pos != L'\0' && i < 255) {
                g_szGameName[i++] = *pos++;
            }
            g_szGameName[i] = L'\0';
        } else {
            int i = 0;
            while (*pos != L'\0' && *pos != L'\r' && *pos != L'\n' && i < 255) {
                if (*pos == L'-' && *(pos + 1) == L'-') break; // Next flag
                g_szGameName[i++] = *pos++;
            }
            while (i > 0 && g_szGameName[i - 1] == L' ') {
                i--;
            }
            g_szGameName[i] = L'\0';
        }
    }

    // 2. Parse --icon <path>
    const wchar_t* flagIcon = L"--icon";
    wchar_t* posIcon = FindStringW(lpCmdLine, flagIcon);
    if (posIcon) {
        posIcon += 6;
        while (*posIcon == L' ') posIcon++;
        if (*posIcon == L'"') {
            posIcon++;
            int i = 0;
            while (*posIcon != L'"' && *posIcon != L'\0' && i < 259) {
                g_szIconPath[i++] = *posIcon++;
            }
            g_szIconPath[i] = L'\0';
        } else {
            int i = 0;
            while (*posIcon != L' ' && *posIcon != L'\0' && *posIcon != L'\r' && *posIcon != L'\n' && i < 259) {
                g_szIconPath[i++] = *posIcon++;
            }
            g_szIconPath[i] = L'\0';
        }
    } else {
        // Fallback: look for "game_icon.ico" in current working directory
        const wchar_t* defIcon = L"game_icon.ico";
        int i = 0;
        while (defIcon[i] && i < 259) {
            g_szIconPath[i] = defIcon[i];
            i++;
        }
        g_szIconPath[i] = L'\0';
    }

    // 3. Load custom game icon
    if (f_LoadImageW && g_szIconPath[0] != L'\0') {
        g_hIconBig = (HICON)f_LoadImageW(NULL, g_szIconPath, IMAGE_ICON, 32, 32, LR_LOADFROMFILE);
        g_hIconSmall = (HICON)f_LoadImageW(NULL, g_szIconPath, IMAGE_ICON, 16, 16, LR_LOADFROMFILE);
    }
    if (!g_hIconBig) {
        g_hIconBig = LoadIcon(NULL, IDI_APPLICATION);
    }
    if (!g_hIconSmall) {
        g_hIconSmall = LoadIcon(NULL, IDI_APPLICATION);
    }

    WNDCLASSW wc = { 0 };
    wc.lpfnWndProc = WndProc;
    wc.hInstance = hInst;
    wc.lpszClassName = L"DQCTray";
    wc.hbrBackground = (HBRUSH)(COLOR_WINDOW + 1);
    wc.hCursor = LoadCursor(NULL, IDC_ARROW);
    wc.hIcon = g_hIconBig;
    RegisterClassW(&wc);

    HWND hWnd = f_CreateWindowExW(0, wc.lpszClassName, g_szGameName, WS_OVERLAPPED | WS_CAPTION | WS_SYSMENU | WS_MINIMIZEBOX, CW_USEDEFAULT, CW_USEDEFAULT, 415, 210, NULL, NULL, hInst, NULL);

    if (hWnd) {
        if (g_hIconBig) {
            SendMessageW(hWnd, WM_SETICON, ICON_BIG, (LPARAM)g_hIconBig);
        }
        if (g_hIconSmall) {
            SendMessageW(hWnd, WM_SETICON, ICON_SMALL, (LPARAM)g_hIconSmall);
        }
    }

    ShowWindow(hWnd, SW_SHOWNORMAL);

    MSG msg;
    while (GetMessageW(&msg, NULL, 0, 0)) {
        TranslateMessage(&msg);
        DispatchMessageW(&msg);
    }
    ExitProcess(0);
}