import fs from 'fs';
let content = fs.readFileSync('pages/Banners.tsx', 'utf-8');

const replacement = `
  const handleDownload = async () => {
    if (!bannerRef.current) return;
    setIsGenerating(true);
    
    const wrapperElement = bannerRef.current.parentElement;
    const originalClassName = wrapperElement ? wrapperElement.className : '';
    
    if (wrapperElement) {
      wrapperElement.className = 'relative origin-top'; // Remove transform and scale classes
    }

    await new Promise(r => setTimeout(r, 100)); // allow DOM to update

    try {
      const canvas = await html2canvas(bannerRef.current, {
        scale: 2, // Melhor qualidade
        backgroundColor: '#000000',
        useCORS: true,
        width: 1080,
        height: 1920,
        windowWidth: 1080,
        windowHeight: 1920,
      });
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = \`Stories_Banner_\${activeTab}_\${selectedRd}.png\`;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error('Erro ao gerar imagem:', error);
      alert('Ocorreu um erro ao gerar o banner. Verifique se há imagens bloqueadas pelo navegador.');
    } finally {
      if (wrapperElement) {
        wrapperElement.className = originalClassName;
      }
      setIsGenerating(false);
    }
  };
`;

const regex = /  const handleDownload = async \(\) => \{[\s\S]*?  \};\n/;

content = content.replace(regex, replacement.trim() + '\n');

fs.writeFileSync('pages/Banners.tsx', content);
