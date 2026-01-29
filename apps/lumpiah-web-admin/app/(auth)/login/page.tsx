"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, Mail, Lock, Eye, EyeOff } from "lucide-react";

import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/shared/components/ui/form";
import { useLogin } from "@/features/auth/hooks/useLogin";

const loginSchema = z.object({
    email: z.string().email("Invalid email address").min(1, "Email is required"),
    password: z.string().min(1, "Password is required"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const LoginPage = () => {
    const [error, setError] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);
    const loginMutation = useLogin();

    const form = useForm<LoginFormValues>({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            email: "",
            password: "",
        },
    });

    const onSubmit = (data: LoginFormValues) => {
        setError(null);
        loginMutation.mutate(data, {
            onError: (err: unknown) => {
                console.error("Login Error Details:", err);

                let errorMessage = "An unexpected error occurred.";

                const errorObj = err as { response?: { data?: { message?: string } }; message?: string };

                if (errorObj?.response?.data?.message) {
                    errorMessage = errorObj.response.data.message;
                } else if (errorObj?.message) {
                    errorMessage = errorObj.message;
                } else if (typeof err === 'string') {
                    errorMessage = err;
                }

                if (errorMessage.includes("accessToken")) {
                    errorMessage = "System Error: Invalid response format from server (missing accessToken).";
                }

                setError(errorMessage);
            },
        });
    };

    return (
        <div className="flex min-h-screen w-full">
            {/* Left Side - Image/Branding */}
            <div className="hidden lg:flex lg:w-1/2 relative bg-zinc-900 text-white flex-col justify-between p-12 overflow-hidden">
                {/* Background Image - z-0 */}
                <div
                    className="absolute inset-0 bg-cover bg-center z-0"
                    style={{ backgroundImage: 'url("/assets/login-bg.png")' }}
                />

                {/* Fallback pattern/gradient if image fails or to enhance - z-0 (below overlay) */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-900/40 via-purple-900/40 to-black/40 z-0" />

                {/* Overlay - z-10 (lighter now) */}
                <div className="absolute inset-0 bg-black/20 z-10" />

                {/* Content - z-20 */}
                <div className="relative z-20 flex items-center gap-2 font-bold text-lg">
                    <div className="h-8 w-8 rounded-lg bg-yellow-500 flex items-center justify-center text-black">
                        L
                    </div>
                    <span>Lumpiah ERP</span>
                </div>

                <div className="relative z-20 space-y-4 max-w-lg">
                    <blockquote className="space-y-2">
                        <p className="text-lg font-medium leading-relaxed drop-shadow-md text-white/90">
                            &ldquo;Streamline your business operations with our comprehensive enterprise resource planning solution. Efficient, reliable, and secure.&rdquo;
                        </p>
                        <footer className="text-sm text-white/70">System Administrator</footer>
                    </blockquote>
                </div>
                <div className="relative z-20 text-xs text-zinc-400">
                    © 2026 Lumpiah ERP Inc.
                </div>
            </div>

            {/* Right Side - Login Form */}
            <div className="flex flex-1 flex-col items-center justify-center p-8 bg-zinc-50 dark:bg-zinc-950">
                <div className="w-full max-w-[400px] space-y-6">
                    <div className="flex flex-col space-y-2 text-center">
                        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                            Welcome back
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Enter your credentials to access the admin panel
                        </p>
                    </div>

                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            {error && (
                                <div className="rounded-md bg-destructive/15 p-3 text-sm font-medium text-destructive dark:text-red-400 text-center animate-in fade-in slide-in-from-top-2">
                                    {error}
                                </div>
                            )}

                            <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Email</FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                                <Input
                                                    placeholder="name@example.com"
                                                    className="pl-9 bg-white dark:bg-zinc-900/50"
                                                    {...field}
                                                    disabled={loginMutation.isPending}
                                                />
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="password"
                                render={({ field }) => (
                                    <FormItem>
                                        <div className="flex items-center justify-between">
                                            <FormLabel>Password</FormLabel>
                                        </div>
                                        <FormControl>
                                            <div className="relative">
                                                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                                <Input
                                                    type={showPassword ? "text" : "password"}
                                                    placeholder="••••••••"
                                                    className="pl-9 pr-9 bg-white dark:bg-zinc-900/50"
                                                    {...field}
                                                    disabled={loginMutation.isPending}
                                                />
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                                    onClick={() => setShowPassword(!showPassword)}
                                                    tabIndex={-1}
                                                >
                                                    {showPassword ? (
                                                        <EyeOff className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                                                    ) : (
                                                        <Eye className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                                                    )}
                                                    <span className="sr-only">
                                                        {showPassword ? "Hide password" : "Show password"}
                                                    </span>
                                                </Button>
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <Button
                                type="submit"
                                className="w-full"
                                disabled={loginMutation.isPending}
                            >
                                {loginMutation.isPending ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Signing in...
                                    </>
                                ) : (
                                    "Sign In"
                                )}
                            </Button>
                        </form>
                    </Form>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
