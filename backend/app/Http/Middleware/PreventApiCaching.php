<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * 認証付き API レスポンスがブラウザにキャッシュされ、
 * アカウント切り替え後に別ユーザーのデータが表示されるのを防ぐ。
 */
class PreventApiCaching
{
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        $response->headers->set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
        $response->headers->set('Pragma', 'no-cache');
        $response->headers->set('Vary', 'Authorization');

        return $response;
    }
}
