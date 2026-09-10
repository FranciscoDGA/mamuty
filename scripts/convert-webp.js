// ============================================
// WEBP CONVERSION — Otimização de imagens
// ============================================
// Next.js Image component já converte para WebP automaticamente
// Este script é para converter imagens existentes no build

const fs = require('fs');
const path = require('path');

// Verificar se sharp está disponível (opcional)
let sharp;
try {
  sharp = require('sharp');
} catch (e) {
  console.log('⚠️  sharp não instalado. Para conversão WebP, execute: npm install sharp');
  process.exit(0);
}

const PUBLIC_DIR = path.join(__dirname, '../public');

async function convertToWebP(inputPath: string, outputPath: string) {
  try {
    await sharp(inputPath)
      .webp({ quality: 80 }) // 80% de qualidade = ~30% menor que JPEG
      .toFile(outputPath);
    
    const inputSize = fs.statSync(inputPath).size;
    const outputSize = fs.statSync(outputPath).size;
    const savings = Math.round((1 - outputSize / inputSize) * 100);
    
    console.log(`✅ ${path.basename(inputPath)} → ${path.basename(outputPath)} (${savings}% menor)`);
  } catch (err) {
    console.error(`❌ Erro ao converter ${path.basename(inputPath)}:`, err);
  }
}

async function convertAllImages() {
  console.log('🖼️  Convertendo imagens para WebP...\n');
  
  const files = fs.readdirSync(PUBLIC_DIR);
  const imageFiles = files.filter((f: string) => 
    /\.(jpg|jpeg|png)$/i.test(f) && !f.includes('.webp')
  );
  
  if (imageFiles.length === 0) {
    console.log('Nenhuma imagem para converter.');
    return;
  }
  
  for (const file of imageFiles) {
    const inputPath = path.join(PUBLIC_DIR, file);
    const outputPath = path.join(PUBLIC_DIR, file.replace(/\.(jpg|jpeg|png)$/i, '.webp'));
    
    // Pular se já existe e é mais recente
    if (fs.existsSync(outputPath)) {
      const inputMtime = fs.statSync(inputPath).mtime;
      const outputMtime = fs.statSync(outputPath).mtime;
      if (outputMtime > inputMtime) {
        console.log(`⏭️  ${file} já está atualizado`);
        continue;
      }
    }
    
    await convertToWebP(inputPath, outputPath);
  }
  
  console.log('\n✨ Conversão concluída!');
}

convertAllImages().catch(console.error);
