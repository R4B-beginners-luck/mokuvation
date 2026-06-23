#include <iostream>
#include <filesystem>
#include <cstdlib>
#include <string>
#include <windows.h>

namespace fs = std::filesystem;

int main() {
    // UTF-8 出力を有効化
    SetConsoleCP(65001);
    SetConsoleOutputCP(65001);

    fs::path root_dir = fs::current_path();
    fs::path backend_dir = root_dir / "backend";
    fs::path frontend_dir = root_dir / "frontend";

    std::cout << "========================================\n";
    std::cout << "    mokuvation 初回セットアップ\n";
    std::cout << "========================================\n\n";

    // [1/3] backend: .env を準備
    std::cout << "[1/3] backend: .env を準備\n";
    fs::path env_file = backend_dir / ".env";
    fs::path env_example_file = backend_dir / ".env.example";

    if (!fs::exists(env_file)) {
        if (fs::exists(env_example_file)) {
            try {
                fs::copy_file(env_example_file, env_file);
                std::cout << ".env を作成しました\n";
                std::cout << ".env が作成されたため、Laravel のアプリキーを生成します\n";

                fs::current_path(backend_dir);
                int result = system("php artisan key:generate --ansi");

                if (result != 0) {
                    std::cout << "\n[ERROR] php artisan key:generate に失敗しました。\n";
                    system("pause");
                    return 1;
                }
            } catch (const fs::filesystem_error& e) {
                std::cerr << "[ERROR] ファイルコピーに失敗: " << e.what() << "\n";
                system("pause");
                return 1;
            }
        } else {
            std::cout << "[WARN] backend\\.env.example が見つかりません。\n";
        }
    }

    std::cout << "\n";

    // [2/3] backend: composer install
    std::cout << "[2/3] backend: composer install\n";
    fs::current_path(backend_dir);
    int composer_result = system("composer install");

    if (composer_result != 0) {
        std::cout << "\n[ERROR] composer install に失敗しました。\n";
        system("pause");
        return 1;
    }

    std::cout << "\n";

    // [3/3] frontend: npm install
    std::cout << "[3/3] frontend: npm install\n";
    fs::current_path(frontend_dir);
    int npm_result = system("npm install");

    if (npm_result != 0) {
        std::cout << "\n[ERROR] npm install に失敗しました。\n";
        system("pause");
        return 1;
    }

    std::cout << "\n";
    std::cout << "========================================\n";
    std::cout << "    セットアップが完了しました。\n";
    std::cout << "========================================\n\n";

    system("pause");
    return 0;
}
