<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Inertia\Response;

class AuthenticatedSessionController extends Controller
{
    /**
     * Display the login view.
     */
    public function create(): Response
    {
        return Inertia::render('Auth/Login', [
            'canResetPassword' => Route::has('password.request'),
            'status' => session('status'),
        ]);
    }

    /**
     * Handle an incoming authentication request.
     */
    public function store(LoginRequest $request): RedirectResponse
    {
        $request->authenticate();

        $request->session()->regenerate();

        $user = Auth::user();
        if ($user) {
            $intended = $request->session()->get('url.intended');
            if ($intended) {
                $path = parse_url($intended, PHP_URL_PATH);
                
                // Check cross-role redirect and redirect to the correct dashboard if there is a conflict
                if ($user->role === 'admin' && str_starts_with($path, '/dosen')) {
                    $request->session()->forget('url.intended');
                    return redirect()->route('admin.dashboard');
                }
                if ($user->role === 'dosen' && str_starts_with($path, '/admin')) {
                    $request->session()->forget('url.intended');
                    return redirect()->route('dosen.dashboard');
                }
            }
        }

        return redirect()->intended(route('dashboard', absolute: false));
    }

    /**
     * Destroy an authenticated session.
     */
    public function destroy(Request $request)
    {
        Auth::guard('web')->logout();

        $request->session()->invalidate();

        $request->session()->regenerateToken();

        return Inertia::location('/');
    }
}
