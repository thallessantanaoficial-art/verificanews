import Parser from 'rss-parser';

export default async function handler(req, res) {
  const parser = new Parser();
  
  // Feed RSS do Google News filtrado por checagem de fatos
  const FEED_URL = 'https://news.google.com/rss/search?q=checagem+de+fatos&hl=pt-BR&gl=BR&ceid=BR:pt-419';

  try {
    const feed = await parser.parseURL(FEED_URL);
    
    // Processa os 6 itens mais recentes
    const newsItems = feed.items.slice(0, 6).map((item, index) => ({
      id: `auto-${Date.now()}-${index}`,
      title: item.title ? item.title.split(' - ')[0] : "Notícia Capturada",
      author: item.source || "Google News RSS",
      date: item.pubDate ? new Date(item.pubDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      category: "Geral",
      status: "Sem Provas", // Status pendente para triagem complementar do editor
      verdict: item.contentSnippet || "Conteúdo capturado automaticamente para verificação e análise editorial.",
      sources: [{ name: "Link da Matéria", url: item.link }]
    }));

    return res.status(200).json({
      success: true,
      timestamp: new Date().toISOString(),
      count: newsItems.length,
      data: newsItems
    });
  } catch (error) {
    console.error("Erro na coleta automática de notícias:", error);
    return res.status(500).json({ error: "Erro ao executar a varredura do feed de notícias." });
  }
}