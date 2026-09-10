# Instruções para Fotos do Mamuty Barbearia

## Arquivos Necessários no `public/`

Salve as fotos que você me enviou nestes caminhos:

### 1. Foto do Hemerson (dono, com óculos)
```
public/barber-hemerson.jpg
```
→ A foto do Hemerson com óculos que você me mandou

### 2. Foto do Doglas (funcionário)
```
public/barber-doglas.jpg
```
→ A foto do Doglas que você me mandou

### 3. Logo da Mamuty
```
public/logo.png
```
→ A logo original da Mamuty (mamute com tesoura e máquina) — substitua o logo.png atual

## Como Salvar (Windows)

### Opção 1: Arrastar e Soltar
1. Abra o Explorador de Arquivos
2. Navegue até `C:\Users\User\OneDrive\Desktop\Mamuty\public\`
3. Arraste as fotos para essa pasta
4. Renomeie conforme os nomes acima

### Opção 2: Copiar/Colar
1. Clique com botão direito na foto → "Copiar"
2. Navegue até a pasta `public`
3. Clique com botão direito → "Colar"
4. Renomeie conforme necessário

## Foto do Marcos (Assistente Digital)

**Não consigo gerar imagens.** Para criar uma foto realista do Marcos, use:

1. **ChatGPT Plus** (DALL-E 3): Peça uma foto de um barbeiro profissional
2. **Leonardo.ai**: Gere gratuitamente com prompt detalhado
3. **Midjourney**: Se tiver acesso
4. **Canva IA**: Ferramenta de geração de imagem

### Prompt Sugerido para Marcos:
```
Professional headshot of a friendly male barber in his 30s, wearing a clean black uniform, 
warm smile, barbershop background, studio lighting, portrait style, realistic photo, 
high quality, 400x400 pixels
```

Salve como: `public/marcos-avatar.jpg`

## Após Salvar as Imagens

1. **Commit e push** as mudanças no Git
2. O deploy automático no Vercel atualizará o site
3. Verifique se as fotos aparecem corretamente no:
   - Homepage (foto dos barbeiros)
   - Agendamento (seleção de profissional)
   - Admin → Profissionais (cards dos barbeiros)

## Nota Técnica

As fotos são servidas diretamente pelo Next.js da pasta `public/`. Não precisam de configuração extra no Supabase ou Vercel.
