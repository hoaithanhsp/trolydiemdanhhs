import React, { useState } from 'react';
import { User, Lock, AlertTriangle } from 'lucide-react';

interface LoginModalProps {
    onLogin: () => void;
}

const LoginModal: React.FC<LoginModalProps> = ({ onLogin }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        if (username.trim() === 'Trần Thị Kim Thoa' && password === '12345') {
            onLogin();
        } else {
            setError('Tên đăng nhập hoặc mật khẩu không đúng!');
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
                <div className="bg-primary p-8 text-center">
                    <div className="w-20 h-20 bg-white rounded-full mx-auto mb-4 flex items-center justify-center text-primary shadow-lg">
                        <Lock size={32} />
                    </div>
                    <h2 className="text-2xl font-bold text-white">Đăng nhập hệ thống</h2>
                    <p className="text-blue-100 mt-2 text-sm">Vui lòng đăng nhập để tiếp tục</p>
                </div>

                <form onSubmit={handleLogin} className="p-8 space-y-6">
                    {error && (
                        <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl flex items-center gap-3 text-sm font-medium border border-red-100">
                            <AlertTriangle size={18} />
                            {error}
                        </div>
                    )}

                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700 block">Tên đăng nhập</label>
                        <div className="relative">
                            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                            <input
                                type="text"
                                className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-primary/50 transition-all outline-none font-medium"
                                placeholder="Nhập tên của bạn"
                                value={username}
                                onChange={(e) => {
                                    setUsername(e.target.value);
                                    setError('');
                                }}
                                autoFocus
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700 block">Mật khẩu</label>
                        <div className="relative">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                            <input
                                type="password"
                                className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-primary/50 transition-all outline-none font-medium"
                                placeholder="••••••"
                                value={password}
                                onChange={(e) => {
                                    setPassword(e.target.value);
                                    setError('');
                                }}
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="w-full py-3.5 bg-primary hover:bg-green-600 text-white font-bold rounded-xl transition-all shadow-lg shadow-green-500/30 flex items-center justify-center gap-2 mt-4"
                    >
                        Đăng nhập ngay
                    </button>
                </form>

                <div className="px-8 pb-6 text-center">
                    <p className="text-xs text-slate-400">
                        Hệ thống điểm danh QR Attendance v1.0
                    </p>
                </div>
            </div>
        </div>
    );
};

export default LoginModal;
