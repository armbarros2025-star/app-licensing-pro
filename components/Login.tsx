
import React, { useState } from 'react';
import { ShieldCheck, Mail, Lock, FileDown, Monitor, Smartphone, Apple } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { assetUrl } from '../utils/assets';
import { institutionLogos } from '../utils/institutionLogos';

const Login: React.FC = () => {
  const { login, loginClientAccess } = useApp();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [clientLoading, setClientLoading] = useState(false);
  const [error, setError] = useState('');

  const formatRetryDelay = (seconds?: number) => {
    if (!seconds || seconds <= 0) return 'alguns minutos';
    if (seconds < 60) return `${seconds} segundo${seconds === 1 ? '' : 's'}`;
    const minutes = Math.ceil(seconds / 60);
    if (minutes < 60) return `${minutes} minuto${minutes === 1 ? '' : 's'}`;
    const hours = Math.ceil(minutes / 60);
    return `${hours} hora${hours === 1 ? '' : 's'}`;
  };

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    if (loading) return;

    setError('');
    const normalizedEmail = email.trim();
    if (!normalizedEmail || !password) {
      setError('Preencha e-mail e senha para continuar.');
      return;
    }

    setLoading(true);
    try {
      const result = await login(normalizedEmail, password);
      if (!result.ok) {
        if (result.retryAfterSeconds) {
          setError(`Muitas tentativas. Tente novamente em aproximadamente ${formatRetryDelay(result.retryAfterSeconds)}.`);
        } else {
          setError(result.message || 'E-mail ou senha incorretos. Verifique suas credenciais.');
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClientAccess = async () => {
    if (loading || clientLoading) return;

    setError('');
    setClientLoading(true);
    try {
      const result = await loginClientAccess();
      if (!result.ok) {
        setError(result.message || 'Não foi possível liberar o acesso de clientes.');
        return;
      }
      navigate('/licencas', { replace: true });
    } finally {
      setClientLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-white px-4 py-5 transition-colors duration-200 sm:px-6 lg:px-10">
      <div aria-hidden="true" className="absolute inset-y-0 left-0 hidden w-1/2 bg-[#302bcc] lg:block" />
      <main className="relative z-10 mx-auto grid min-h-[calc(100vh-2.5rem)] w-full max-w-xl grid-cols-1 overflow-hidden rounded-2xl bg-white lg:max-w-7xl lg:grid-cols-2">
        <section className="relative hidden min-h-full overflow-hidden bg-[#302bcc] px-12 py-14 text-white lg:flex lg:flex-col lg:justify-between">
          <div aria-hidden="true" className="absolute inset-0 overflow-hidden opacity-25">
            <div className="absolute -left-52 top-20 h-[38rem] w-[42rem] rounded-full border border-white/30" />
            <div className="absolute -left-28 top-10 h-[32rem] w-[38rem] rounded-full border border-white/25" />
            <div className="absolute -left-8 top-36 h-[28rem] w-[34rem] rounded-full border border-white/20" />
          </div>

          <div className="relative z-10 w-full max-w-md">
            <img src={assetUrl('logo_arbtech_yellow.png')} alt="Arbtech Info" className="h-auto w-36 object-contain" />
          </div>

          <div className="relative z-10 w-full max-w-md">
            <h1 className="text-5xl font-bold leading-[0.96] tracking-[-0.03em] text-white">Olá,</h1>
            <p className="mt-2 text-5xl font-bold leading-[0.96] tracking-[-0.03em] text-white">Licensing Pro!</p>
            <p className="mt-8 max-w-md text-xl leading-8 text-white/90">Controle de licenças, vencimentos, documentos e renovações com segurança e praticidade.</p>
          </div>

          <div className="relative z-10 w-full max-w-md">
            <div className="grid grid-cols-4 gap-x-5 gap-y-4" role="list" aria-label="Órgãos e entidades atendidos">
              {institutionLogos.map(({ name, file }) => (
                <div key={file} role="listitem" className="flex h-16 items-center justify-center py-1">
                  <img
                    src={assetUrl(`institution-logos-transparent/${file}`)}
                    alt={name}
                    width={180}
                    height={96}
                    className="max-h-14 w-full object-contain"
                    decoding="async"
                  />
                </div>
              ))}
            </div>
          </div>
          <p className="relative z-10 flex w-full max-w-md items-start gap-3 text-sm leading-6 text-white/85"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-white" />Acesso protegido para acompanhamento de licenças e obrigações corporativas.</p>
        </section>

        <section className="flex min-h-full w-full items-center justify-center bg-white px-8 py-16 text-[#171717] sm:px-14">
          <div className="mx-auto w-full max-w-sm">
            <div className="mb-10 text-left">
              <img src={assetUrl('logo_arbtech_yellow.png')} alt="Arbtech Info" className="mx-auto h-auto w-28 object-contain lg:hidden" />
              <p className="mt-5 text-4xl font-bold tracking-[-0.03em] text-[#171717] sm:text-5xl">Licensing Pro</p>
              <h2 className="mt-4 text-2xl font-semibold tracking-[-0.02em] text-[#171717]">Bem-vindo de volta</h2>
            </div>

            <form className="mx-auto w-full space-y-6" onSubmit={handleLogin} aria-busy={loading}>
            <div className="space-y-2">
              <label htmlFor="licensing-email" className="block text-sm font-medium text-[#171717]">E-mail corporativo</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#696969]" />
                <input
                  id="licensing-email"
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(''); }}
                  placeholder="seuemail@empresa.com.br"
                  autoComplete="username"
                  name="licensing-email"
                  className="w-full rounded-lg border border-[#d6d6d6] bg-white py-4 pl-12 pr-4 text-sm font-medium text-[#171717] placeholder:text-[#737373] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#171717] focus-visible:ring-offset-2 focus-visible:ring-offset-white"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="licensing-password" className="block text-sm font-medium text-[#171717]">Senha de acesso</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#696969]" />
                <input
                  id="licensing-password"
                  type="password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(''); }}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  name="licensing-password"
                  className="w-full rounded-lg border border-[#d6d6d6] bg-white py-4 pl-12 pr-4 text-sm font-medium text-[#171717] placeholder:text-[#737373] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#171717] focus-visible:ring-offset-2 focus-visible:ring-offset-white"
                />
              </div>
            </div>
            {error && (
              <div role="alert" aria-live="assertive" className="rounded-lg border border-rose-300 bg-rose-50 p-3 text-center text-xs font-semibold text-rose-700">
                {error}
              </div>
            )}

            <div className="space-y-3 pt-2">
              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-3 rounded-lg bg-[#171717] py-4 text-sm font-semibold text-white transition-colors hover:bg-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#171717] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loading ? 'Entrando...' : <>Entrar no Painel <ShieldCheck className="w-4 h-4" /></>}
              </button>
              <div className="flex justify-center pt-1">
                <button
                  type="button"
                  onClick={handleClientAccess}
                  disabled={loading || clientLoading}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-[#d6d6d6] px-4 py-3.5 text-center text-xs font-semibold text-[#171717] transition-colors hover:border-[#171717] hover:bg-[#fafafa] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#171717] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  <FileDown className="h-4 w-4 shrink-0" />
                  <span>{clientLoading ? 'Liberando acesso...' : 'Acesso clientes para imprimir e baixar licenças'}</span>
                </button>
              </div>
              <div className="my-7 flex items-center gap-3 text-sm text-[#737373]" aria-hidden="true">
                <span className="h-px flex-1 bg-current opacity-30" />
                <span>ou acesse pelo app</span>
                <span className="h-px flex-1 bg-current opacity-30" />
              </div>
              <div className="flex items-center justify-between gap-3 text-sm font-medium text-[#171717]" aria-label="Disponível para Windows 11, Android e iOS">
                <span className="inline-flex items-center gap-1.5"><Monitor aria-hidden="true" className="h-4 w-4" />Windows 11</span>
                <span className="inline-flex items-center gap-1.5"><Smartphone aria-hidden="true" className="h-4 w-4" />Android</span>
                <span className="inline-flex items-center gap-1.5"><Apple aria-hidden="true" className="h-4 w-4" />iOS</span>
              </div>
            </div>
            </form>
            <div className="mt-12 flex items-center justify-center gap-2 text-sm font-medium text-[#171717]">
              <ShieldCheck className="h-4 w-4" />
              Acesso seguro e criptografado
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Login;
