// Resumo (cheat sheet) por domínio — pontos-chave condensados pra revisão rápida antes da prova

CHEATSHEET[1] = [
  "<b>Benefícios da nuvem:</b> trocar CapEx por OpEx, economia de escala, parar de adivinhar capacidade, aumentar velocidade/agilidade, parar de manter data centers, ir global em minutos.",
  "<b>Região:</b> agrupa múltiplas AZs. <b>AZ:</b> 1+ data centers isolados. <b>Edge Location:</b> ponto de presença pra baixa latência (CloudFront, Route 53).",
  "<b>Well-Architected Framework — 6 pilares:</b> Excelência Operacional, Segurança, Confiabilidade, Eficiência de Performance, Otimização de Custos, Sustentabilidade.",
  "<b>AWS CAF — 6 perspectivas:</b> Business, People, Governance (negócio) + Platform, Security, Operations (técnicas).",
  "<b>Modelos de implantação:</b> pública (compartilhada), privada (dedicada), híbrida (conecta on-premises com a nuvem).",
  "<b>Estratégias de migração (6 Rs):</b> Rehost (lift-and-shift), Replatform, Repurchase, Refactor, Retain, Retire."
];

CHEATSHEET[2] = [
  "<b>Shared Responsibility Model:</b> AWS cuida da segurança 'DA' nuvem (infraestrutura física, rede global); cliente cuida da segurança 'NA' nuvem (dados, IAM, SO, criptografia, Security Groups).",
  "<b>IAM:</b> User (identidade fixa) · Group (coleção de users) · Role (permissão temporária assumível) · Policy (documento JSON de permissões). Sempre aplicar o <b>menor privilégio</b>.",
  "<b>Root account:</b> ativar MFA, evitar uso no dia a dia, criar IAM users/roles para tarefas administrativas.",
  "<b>Detecção de ameaças:</b> GuardDuty (atividade maliciosa) · Inspector (vulnerabilidades) · Macie (dados sensíveis no S3).",
  "<b>Proteção de borda:</b> Shield (DDoS, Standard grátis / Advanced pago) · WAF (firewall de aplicação web).",
  "<b>Criptografia e segredos:</b> KMS (chaves) · Secrets Manager (credenciais) · ACM (certificados SSL/TLS).",
  "<b>Auditoria e conformidade:</b> CloudTrail (log de chamadas de API) · Config (histórico de configuração) · Artifact (relatórios de compliance como SOC, PCI, HIPAA).",
  "<b>Rede:</b> Security Group = stateful, nível de instância, só 'allow'. NACL = stateless, nível de subnet, 'allow' e 'deny'.",
  "<b>Organizations:</b> gerencia múltiplas contas; SCPs definem o teto de permissões possíveis em contas-membro."
];

CHEATSHEET[3] = [
  "<b>Computação:</b> EC2 (servidores virtuais) · Lambda (serverless por evento) · Elastic Beanstalk (deploy automatizado) · ECS/EKS (orquestração de containers) · Fargate (containers serverless) · Outposts (AWS on-premises).",
  "<b>Armazenamento:</b> S3 (objetos) · EBS (blocos, anexado a 1 instância) · EFS (arquivos, compartilhado entre instâncias) · Storage Gateway (híbrido) · Snow Family (transporte físico de dados).",
  "<b>Classes do S3:</b> Standard (frequente) → Intelligent-Tiering → Standard-IA / One Zone-IA (infrequente) → Glacier / Glacier Deep Archive (arquivamento, mais barato).",
  "<b>Bancos de dados:</b> RDS (relacional gerenciado) · Aurora (relacional AWS, alta performance) · DynamoDB (NoSQL serverless) · Redshift (data warehouse/analytics) · ElastiCache (cache em memória).",
  "<b>Rede:</b> VPC (rede isolada) · Subnet pública (rota p/ Internet Gateway) vs privada · NAT Gateway (saída sem entrada) · Route 53 (DNS) · CloudFront (CDN) · ELB (balanceamento) · Direct Connect (conexão dedicada).",
  "<b>Gestão e automação:</b> CloudFormation (IaC) · CloudWatch (monitoramento/alarmes) · Auto Scaling (ajuste automático de capacidade).",
  "<b>Mensageria:</b> SNS (pub/sub) · SQS (filas, desacoplamento).",
  "<b>IA/ML:</b> SageMaker (construir/treinar/implantar modelos) · Bedrock (acesso a modelos fundacionais de IA generativa via API)."
];

CHEATSHEET[4] = [
  "<b>Modelos de preço EC2:</b> On-Demand (sem compromisso) · Reserved Instances (1-3 anos, até ~72% de desconto) · Spot (até 90% de desconto, pode ser interrompida) · Savings Plans (compromisso de gasto, mais flexível que RI).",
  "<b>Free Tier:</b> 'always free', '12 months free' ou 'trials', dependendo do serviço.",
  "<b>Ferramentas de custo:</b> Pricing Calculator (estimar antes de implantar) · Cost Explorer (analisar gastos passados/futuros) · Budgets (alertas de orçamento).",
  "<b>Consolidated Billing:</b> uma fatura só para múltiplas contas no AWS Organizations, com desconto por volume agregado.",
  "<b>Planos de suporte:</b> Basic (grátis, sem suporte técnico) → Developer → Business → Enterprise (TAM dedicado, resposta mais rápida)."
];

CHEATSHEET.tips = [
  "A prova tem 65 questões (50 valem nota + 15 não pontuam, mas você não sabe quais são) em 90 minutos. Nota mínima: 700/1000.",
  "Domínios mais pesados (Segurança 30% + Tecnologia 34% = 64% da prova) merecem mais tempo de estudo proporcional.",
  "Em questões de múltipla resposta, leia com atenção quantas alternativas marcar — geralmente a própria questão avisa ('selecione DOIS').",
  "Quando ficar em dúvida entre dois serviços parecidos, pense no caso de uso principal de cada um (ex: S3 = objetos, EBS = disco de 1 instância, EFS = arquivo compartilhado).",
  "Releia as perguntas com 'NÃO' ou 'EXCETO' — é fácil errar por pressa nesse tipo de pegadinha."
];
