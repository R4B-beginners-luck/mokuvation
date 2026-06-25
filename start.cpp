#include <iostream>
#include <filesystem>
#include <cstdlib>
#include <string>
#include <windows.h>
#include <thread>
#include <chrono>

namespace fs = std::filesystem;

int main() {
    // UTF-8 出力を有効化
    SetConsoleCP(65001);
    SetConsoleOutputCP(65001);

    fs::path root_dir = fs::current_path();
    fs::path backend_dir = root_dir / "backend";
    fs::path frontend_dir = root_dir / "frontend";

    std::cout << "========================================\n";
    std::cout << "    mokuvation 起動スクリプト\n";
    std::cout << "========================================\n\n";
    std::cout << "XAMPPのApacheとMySQLが起動していることを\n";
    std::cout << "確認してから何かキーを押してください...\n";

    system("pause >nul");

    // Laravel サーバーを起動
    std::string backend_cmd = "start \"mokuvation - Laravel Server\" cmd /k \"cd /d \"" + backend_dir.string() + "\" && php artisan serve\"";
    system(backend_cmd.c_str());

    // 3秒待機（127.0.0.1へのping相当）
    std::this_thread::sleep_for(std::chrono::seconds(3));

    // React フロントエンドを起動
    std::string frontend_cmd = "start \"mokuvation - React Frontend\" cmd /k \"cd /d \"" + frontend_dir.string() + "\" && npm run dev\"";
    system(frontend_cmd.c_str());

    std::cout << "\n";
    std::cout << "========================================\n";
    std::cout << "    起動完了！\n";
    std::cout << "    フロント: http://localhost:5173\n";
    std::cout << "    API:      http://localhost:8000\n";
    std::cout << "========================================\n\n";
    std::cout << "このウィンドウは閉じても構いません。\n";

    system("pause >nul");
    return 0;
}
