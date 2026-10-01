import Link from "next/link";
import { Logo } from "@/components/Logo";

export const metadata = {
  title: "Política de Privacidade — Lucratifood",
  description: "Como o Lucratifood coleta, usa e protege seus dados pessoais e empresariais, em conformidade com a LGPD.",
};

const LAST_UPDATED = "28 de setembro de 2025";
const CONTACT_EMAIL = "privacidade@lucratifood.com.br";
const COMPANY_NAME = "Lucratifood";

export default function PrivacidadePage() {
  return (
    <div className="min-h-screen bg-background font-sans">
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-8 py-4">
          <Logo size="sm" href="/" />
          <Link href="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            ← Voltar ao início
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-8 py-16">
        <div className="mb-10">
          <h1 className="text-4xl font-extrabold text-foreground mb-3">Política de Privacidade</h1>
          <p className="text-sm text-muted-foreground">Última atualização: {LAST_UPDATED}</p>
        </div>

        <div className="prose prose-neutral max-w-none space-y-10 text-foreground">

          <section>
            <p className="text-muted-foreground leading-relaxed">
              O <strong>{COMPANY_NAME}</strong> ("nós", "nosso" ou "plataforma") está comprometido com a proteção dos seus dados pessoais e empresariais. Esta Política de Privacidade descreve como coletamos, usamos, armazenamos, compartilhamos e protegemos as informações fornecidas ao utilizar nossa plataforma, em conformidade com a <strong>Lei Geral de Proteção de Dados Pessoais (LGPD – Lei nº 13.709/2018)</strong>.
            </p>
            <p className="text-muted-foreground leading-relaxed mt-4">
              Ao se cadastrar e utilizar o {COMPANY_NAME}, você declara ter lido e concordado com os termos desta Política. Recomendamos a leitura integral antes de fornecer qualquer dado.
            </p>
          </section>

          <Section title="1. Quem somos">
            <p>
              O {COMPANY_NAME} é uma plataforma SaaS de precificação e gestão de fichas técnicas para restaurantes e negócios de gastronomia. Na relação com nossos clientes (donos e gestores de restaurantes), atuamos como <strong>Controlador de Dados</strong>, conforme definido pelo art. 5º, VI da LGPD.
            </p>
            <p>
              Os dados inseridos pelos clientes sobre seus próprios negócios (insumos, receitas, preços e custos) são tratados por nós como <strong>Operador</strong> em nome do cliente, que permanece responsável pela licitude e exatidão dessas informações.
            </p>
          </Section>

          <Section title="2. Dados que coletamos">
            <Subsection title="2.1 Dados de cadastro e conta">
              <ul>
                <li>Nome completo</li>
                <li>Endereço de e-mail</li>
                <li>Nome do restaurante ou empresa</li>
                <li>Número de WhatsApp</li>
                <li>Perfil do Instagram (opcional, fornecido no formulário de demonstração)</li>
              </ul>
            </Subsection>
            <Subsection title="2.2 Dados operacionais do negócio">
              <p>Ao utilizar a plataforma, você insere dados relacionados ao seu negócio, como:</p>
              <ul>
                <li>Fichas técnicas, receitas e sub-receitas</li>
                <li>Insumos, fornecedores e preços de compra</li>
                <li>Canais de venda e comissões</li>
                <li>Custos operacionais e margens desejadas</li>
              </ul>
              <p>
                Esses dados são de titularidade do cliente e são tratados exclusivamente para prestação do serviço contratado. O {COMPANY_NAME} não utiliza, compartilha ou analisa dados operacionais individuais de clientes para fins comerciais próprios.
              </p>
            </Subsection>
            <Subsection title="2.3 Dados de uso e navegação">
              <ul>
                <li>Endereço IP e informações do dispositivo</li>
                <li>Páginas acessadas, tempo de sessão e cliques</li>
                <li>Tipo de navegador e sistema operacional</li>
              </ul>
            </Subsection>
            <Subsection title="2.4 Dados de comunicação">
              <p>
                Registramos interações por e-mail, WhatsApp ou chat de suporte para fins de atendimento e histórico do relacionamento.
              </p>
            </Subsection>
          </Section>

          <Section title="3. Finalidade e base legal do tratamento">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 pr-4 font-semibold">Finalidade</th>
                  <th className="text-left py-2 font-semibold">Base legal (LGPD)</th>
                </tr>
              </thead>
              <tbody className="text-muted-foreground divide-y divide-border">
                {[
                  ["Criação e gestão da conta", "Execução de contrato (art. 7º, V)"],
                  ["Prestação do serviço de precificação", "Execução de contrato (art. 7º, V)"],
                  ["Envio de comunicações sobre o serviço", "Legítimo interesse (art. 7º, IX)"],
                  ["Envio de novidades e promoções", "Consentimento (art. 7º, I)"],
                  ["Segurança, prevenção de fraudes e auditoria", "Legítimo interesse (art. 7º, IX)"],
                  ["Cumprimento de obrigações legais e fiscais", "Obrigação legal (art. 7º, II)"],
                  ["Melhoria contínua da plataforma (dados agregados e anonimizados)", "Legítimo interesse (art. 7º, IX)"],
                ].map(([fin, base]) => (
                  <tr key={fin}>
                    <td className="py-2 pr-4">{fin}</td>
                    <td className="py-2">{base}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Section>

          <Section title="4. Armazenamento e segurança dos dados">
            <p>
              Os dados são armazenados em servidores gerenciados pelo <strong>Supabase</strong> (infraestrutura PostgreSQL hospedada na AWS), com criptografia em trânsito (TLS/HTTPS) e em repouso. O {COMPANY_NAME} adota as seguintes medidas de segurança:
            </p>
            <ul>
              <li>Controle de acesso baseado em políticas de segurança em nível de linha (<em>Row Level Security</em>) — cada cliente acessa somente seus próprios dados</li>
              <li>Autenticação segura via Supabase Auth</li>
              <li>Senhas armazenadas com hash (nunca em texto puro)</li>
              <li>Acesso administrativo restrito a membros autorizados da equipe</li>
              <li>Backups automáticos com retenção mínima de 7 dias</li>
            </ul>
            <p>
              Apesar de todas as medidas adotadas, nenhum sistema é 100% inviolável. Em caso de incidente de segurança que possa afetar seus dados, notificaremos os titulares e a Autoridade Nacional de Proteção de Dados (ANPD) no prazo legal.
            </p>
          </Section>

          <Section title="5. Retenção dos dados">
            <p>
              Mantemos seus dados pelo tempo necessário para a prestação do serviço e pelo período exigido pela legislação aplicável:
            </p>
            <ul>
              <li><strong>Dados de conta ativa:</strong> durante toda a vigência do contrato</li>
              <li><strong>Após encerramento da conta:</strong> até 5 anos para fins fiscais e legais (art. 12 da Lei nº 9.613/1998 e legislação tributária)</li>
              <li><strong>Dados de navegação:</strong> até 6 meses</li>
              <li><strong>Leads e contatos de demonstração:</strong> até 2 anos ou até solicitação de exclusão</li>
            </ul>
          </Section>

          <Section title="6. Compartilhamento de dados">
            <p>
              O {COMPANY_NAME} <strong>não vende, aluga ou cede</strong> dados pessoais a terceiros para fins comerciais. Compartilhamos dados apenas nas seguintes situações:
            </p>
            <ul>
              <li><strong>Prestadores de serviço (suboperadores):</strong> Supabase (banco de dados e autenticação), Vercel (hospedagem), Cal.com ou Calendly (agendamento de demonstrações), serviços de e-mail transacional. Todos operam sob acordos de confidencialidade e tratam os dados somente para as finalidades contratadas.</li>
              <li><strong>Obrigação legal:</strong> quando exigido por autoridade pública, ordem judicial ou cumprimento de obrigação legal.</li>
              <li><strong>Proteção de direitos:</strong> para prevenir fraudes, exercer direitos contratuais ou proteger a segurança da plataforma e dos usuários.</li>
            </ul>
          </Section>

          <Section title="7. Dados de terceiros inseridos pelo cliente">
            <p>
              Ao utilizar a plataforma, o cliente pode inserir dados de fornecedores e outras informações de negócio que envolvam terceiros. O cliente é integralmente responsável pela legalidade de inserção e tratamento dessas informações, devendo garantir que possui base legal adequada conforme a LGPD. O {COMPANY_NAME} trata esses dados exclusivamente em nome do cliente e conforme suas instruções.
            </p>
          </Section>

          <Section title="8. Seus direitos como titular de dados">
            <p>
              Nos termos do art. 18 da LGPD, você tem direito a:
            </p>
            <ul>
              <li><strong>Acesso:</strong> obter confirmação e cópia dos dados que tratamos sobre você</li>
              <li><strong>Correção:</strong> solicitar a atualização de dados incompletos, inexatos ou desatualizados</li>
              <li><strong>Anonimização, bloqueio ou eliminação:</strong> de dados desnecessários ou tratados em desconformidade com a lei</li>
              <li><strong>Portabilidade:</strong> receber seus dados em formato estruturado e interoperável</li>
              <li><strong>Revogação do consentimento:</strong> quando o tratamento for baseado em consentimento</li>
              <li><strong>Oposição:</strong> contestar tratamentos realizados com base em legítimo interesse</li>
              <li><strong>Eliminação total:</strong> solicitar a exclusão de todos os dados pessoais após o encerramento da conta, respeitados os prazos legais de retenção</li>
            </ul>
            <p>
              Para exercer qualquer um desses direitos, entre em contato pelo e-mail <strong>{CONTACT_EMAIL}</strong>. Responderemos em até 15 dias corridos.
            </p>
          </Section>

          <Section title="9. Cookies e tecnologias de rastreamento">
            <p>
              Utilizamos cookies essenciais para o funcionamento da plataforma (autenticação e preferências de sessão). Não utilizamos cookies de rastreamento publicitário de terceiros. Você pode gerenciar os cookies pelo seu navegador, mas a desativação de cookies essenciais pode impedir o uso de determinadas funcionalidades.
            </p>
          </Section>

          <Section title="10. Transferência internacional de dados">
            <p>
              Os dados são armazenados em servidores localizados nos <strong>Estados Unidos</strong> (infraestrutura AWS via Supabase e Vercel). Essas transferências são realizadas com base em cláusulas contratuais padrão e mecanismos de adequação reconhecidos, assegurando nível de proteção equivalente ao exigido pela LGPD (art. 33).
            </p>
          </Section>

          <Section title="11. Menores de idade">
            <p>
              A plataforma {COMPANY_NAME} é destinada exclusivamente a pessoas maiores de 18 anos. Não coletamos intencionalmente dados de menores. Se tomarmos conhecimento de que dados de menores foram fornecidos sem autorização dos responsáveis, procederemos à exclusão imediata.
            </p>
          </Section>

          <Section title="12. Alterações nesta Política">
            <p>
              Podemos atualizar esta Política periodicamente para refletir mudanças na legislação, nas nossas práticas ou nos serviços oferecidos. Alterações relevantes serão comunicadas por e-mail ou notificação na plataforma com antecedência mínima de 10 dias. O uso continuado após a notificação implica aceite das novas condições.
            </p>
          </Section>

          <Section title="13. Encarregado de Dados (DPO) e contato">
            <p>
              Para dúvidas, solicitações ou reclamações relacionadas ao tratamento de dados pessoais, entre em contato com nosso Encarregado de Proteção de Dados (DPO):
            </p>
            <div className="mt-3 rounded-xl border border-border bg-card p-5 text-sm space-y-1">
              <p><strong>{COMPANY_NAME}</strong></p>
              <p>E-mail: <a href={`mailto:${CONTACT_EMAIL}`} className="text-primary hover:underline">{CONTACT_EMAIL}</a></p>
              <p>Você também pode registrar reclamações diretamente na <a href="https://www.gov.br/anpd" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Autoridade Nacional de Proteção de Dados (ANPD)</a>.</p>
            </div>
          </Section>

        </div>
      </main>

      <footer className="border-t border-border py-8 px-8 mt-8">
        <div className="mx-auto max-w-7xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <Logo size="md" href="/" />
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Lucratifood. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-xl font-bold text-foreground">{title}</h2>
      <div className="text-muted-foreground leading-relaxed space-y-3 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1.5 [&_strong]:text-foreground">
        {children}
      </div>
    </section>
  );
}

function Subsection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <h3 className="font-semibold text-foreground">{title}</h3>
      <div className="space-y-2">{children}</div>
    </div>
  );
}
