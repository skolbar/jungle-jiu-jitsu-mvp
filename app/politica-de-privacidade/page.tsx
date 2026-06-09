import type { Metadata } from "next"
import Link from "next/link"

const SUPPORT_EMAIL = "Murilovendra2010@gmail.com"

export const metadata: Metadata = {
  title: "Política de Privacidade | Jungle Jiu-Jitsu",
  description: "Política de privacidade do aplicativo Jungle Jiu-Jitsu.",
  alternates: {
    canonical: "/politica-de-privacidade",
  },
}

const sections = [
  {
    title: "1. Quem somos",
    content: (
      <p>
        Esta Política de Privacidade descreve como o aplicativo <strong>Jungle Jiu-Jitsu</strong> e a Jungle Escola
        de Jiu-Jitsu tratam os dados pessoais de alunos, professores e administradores que utilizam a plataforma.
      </p>
    ),
  },
  {
    title: "2. Dados tratados",
    content: (
      <>
        <p>Podemos tratar os seguintes dados, conforme as funções utilizadas:</p>
        <ul>
          <li>nome, endereço de e-mail e identificador da conta;</li>
          <li>foto de perfil, quando o usuário optar por adicioná-la;</li>
          <li>função de acesso, faixa, grau e informações de progressão;</li>
          <li>presenças, check-ins, total de aulas e histórico relacionado aos treinos;</li>
          <li>comunicados, conteúdos e registros administrativos criados por usuários autorizados;</li>
          <li>
            informações técnicas necessárias para autenticação, segurança e funcionamento, como tokens de sessão,
            data e hora de acesso, endereço IP e registros de erro.
          </li>
        </ul>
        <p>
          As senhas são processadas pelo serviço de autenticação e não são armazenadas pela Jungle em formato de
          texto legível.
        </p>
      </>
    ),
  },
  {
    title: "3. Como utilizamos os dados",
    content: (
      <>
        <p>Os dados são utilizados para:</p>
        <ul>
          <li>autenticar usuários e controlar permissões de aluno e administrador;</li>
          <li>exibir perfil, graduação, progresso e histórico de presenças;</li>
          <li>liberar conteúdos conforme faixa e grau;</li>
          <li>permitir a gestão de alunos, aulas, check-ins e comunicados;</li>
          <li>prestar suporte, corrigir falhas e proteger a plataforma contra uso indevido;</li>
          <li>cumprir obrigações legais ou solicitações legítimas de autoridades competentes.</li>
        </ul>
      </>
    ),
  },
  {
    title: "4. Compartilhamento e operadores",
    content: (
      <>
        <p>Não vendemos dados pessoais e não utilizamos os dados para publicidade comportamental.</p>
        <p>
          Para operar a plataforma, dados podem ser processados por prestadores de infraestrutura, especialmente
          Supabase, para autenticação, banco de dados e armazenamento, e Vercel, para hospedagem do sistema e das APIs.
          Esses prestadores atuam conforme seus próprios termos e medidas de segurança.
        </p>
        <p>
          Alguns conteúdos podem abrir serviços externos, como o YouTube. Ao sair do aplicativo, o tratamento passa
          também a seguir a política do serviço acessado.
        </p>
      </>
    ),
  },
  {
    title: "5. Armazenamento e segurança",
    content: (
      <p>
        Utilizamos conexões criptografadas, autenticação, controle de acesso e regras de autorização para proteger os
        dados. Apesar das medidas adotadas, nenhum serviço conectado à internet pode garantir segurança absoluta.
      </p>
    ),
  },
  {
    title: "6. Retenção dos dados",
    content: (
      <p>
        Dados de conta e perfil são mantidos enquanto a conta estiver ativa ou enquanto forem necessários para as
        finalidades descritas nesta política. Após uma solicitação válida de exclusão, os dados pessoais associados
        serão excluídos ou anonimizados, salvo quando a manutenção for necessária para cumprir obrigação legal,
        preservar a segurança, prevenir fraude ou resolver disputas. Cópias residuais podem permanecer por período
        limitado em rotinas protegidas de backup até sua substituição.
      </p>
    ),
  },
  {
    title: "7. Direitos do titular",
    content: (
      <p>
        O titular pode solicitar confirmação de tratamento, acesso, correção, atualização, anonimização, portabilidade
        quando aplicável e exclusão de dados, conforme a legislação aplicável. A identidade do solicitante poderá ser
        verificada antes do atendimento para proteger a conta.
      </p>
    ),
  },
  {
    title: "8. Crianças e adolescentes",
    content: (
      <p>
        Contas são criadas e administradas no contexto da academia. Quando o usuário for criança ou adolescente, o
        tratamento deverá ocorrer com a ciência e supervisão do responsável legal, conforme aplicável.
      </p>
    ),
  },
  {
    title: "9. Alterações desta política",
    content: (
      <p>
        Esta política poderá ser atualizada para refletir mudanças no aplicativo, nos serviços utilizados ou em
        requisitos legais. A versão vigente permanecerá disponível nesta página, acompanhada da data da última
        atualização.
      </p>
    ),
  },
]

export default function PrivacyPolicyPage() {
  const deletionSubject = encodeURIComponent("Solicitação de exclusão de conta - Jungle Jiu-Jitsu")
  const deletionBody = encodeURIComponent(
    "Olá,\n\nSolicito a exclusão da minha conta e dos dados pessoais associados ao aplicativo Jungle Jiu-Jitsu.\n\nNome:\nE-mail da conta:\n",
  )

  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex w-full max-w-4xl items-center justify-between gap-4 px-5 py-5 sm:px-8">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-md bg-primary text-lg font-bold text-primary-foreground">
              J
            </div>
            <span className="font-bold">Jungle Jiu-Jitsu</span>
          </div>
          <Link className="text-sm font-semibold text-primary hover:underline" href="/login">
            Acessar o sistema
          </Link>
        </div>
      </header>

      <div className="mx-auto w-full max-w-4xl px-5 py-12 sm:px-8 sm:py-16">
        <div className="max-w-3xl">
          <p className="mb-3 text-sm font-bold uppercase text-primary">Privacidade e dados pessoais</p>
          <h1 className="text-3xl font-bold sm:text-4xl">Política de Privacidade</h1>
          <p className="mt-4 text-base leading-7 text-muted-foreground">Última atualização: 9 de junho de 2026.</p>
        </div>

        <div className="mt-12 space-y-10">
          {sections.map((section) => (
            <section className="max-w-3xl space-y-4" key={section.title}>
              <h2 className="text-xl font-bold">{section.title}</h2>
              <div className="space-y-4 text-base leading-7 text-muted-foreground [&_li]:ml-5 [&_li]:list-disc [&_li]:pl-1 [&_ul]:space-y-2">
                {section.content}
              </div>
            </section>
          ))}

          <section
            className="max-w-3xl border-l-4 border-primary bg-secondary px-5 py-6 sm:px-7"
            id="exclusao-de-conta"
          >
            <h2 className="text-xl font-bold">10. Exclusão de conta e dados</h2>
            <div className="mt-4 space-y-4 text-base leading-7 text-muted-foreground">
              <p>
                Para solicitar a exclusão da conta e dos dados pessoais associados, envie uma mensagem pelo botão
                abaixo usando o e-mail cadastrado no aplicativo. Informe seu nome e o e-mail da conta.
              </p>
              <p>
                A solicitação será analisada e atendida nos prazos aplicáveis. Dados que precisem ser mantidos por
                obrigação legal, segurança ou prevenção de fraude poderão ser retidos somente pelo período necessário.
              </p>
              <a
                className="inline-flex min-h-11 items-center justify-center rounded-md bg-primary px-5 py-2 font-bold text-primary-foreground hover:bg-primary/90"
                href={`mailto:${SUPPORT_EMAIL}?subject=${deletionSubject}&body=${deletionBody}`}
              >
                Solicitar exclusão da conta
              </a>
            </div>
          </section>

          <section className="max-w-3xl space-y-4 border-t border-border pt-8">
            <h2 className="text-xl font-bold">11. Contato</h2>
            <p className="text-base leading-7 text-muted-foreground">
              Dúvidas, solicitações e assuntos relacionados à privacidade podem ser enviados para{" "}
              <a className="font-semibold text-primary hover:underline" href={`mailto:${SUPPORT_EMAIL}`}>
                {SUPPORT_EMAIL}
              </a>
              .
            </p>
          </section>
        </div>
      </div>
    </main>
  )
}
