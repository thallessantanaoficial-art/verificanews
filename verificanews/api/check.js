import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
  // Configurar cabeçalhos CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido. Utilize POST.' });
  }

  const { claimText, sourceUrl } = req.body || {};

  if (!claimText) {
    return res.status(400).json({ error: 'O texto da notícia/afirmação é obrigatório.' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'A variável de ambiente GEMINI_API_KEY não foi configurada na Vercel.' });
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
    Você é um jornalista sénior especialista em checagem de fatos (Fact-Checking).
    Analise com critério rigoroso a seguinte afirmação e/ou link enviado por um utilizador:

    Afirmação: "${claimText}"
    Fonte/Link informado: "${sourceUrl || 'Nenhum link fornecido'}"

    Responda EXCLUSIVAMENTE num formato JSON VÁLIDO (sem qualquer formatação markdown ou blocos de código extra).
    Siga rigorosamente esta estrutura de chaves:
    {
      "status": "Verdadeiro" | "Falso" | "Parcial" | "Sem Provas",
      "category": "Política" | "Saúde" | "Ciência" | "Geral",
      "verdict": "Resumo explicativo e conclusivo em português do Brasil de até 3 frases sobre o motivo da classificação.",
      "suggested_sources": [
        { "name": "Nome da Fonte Oficial / Agência de Checagem", "url": "https://link-da-fonte.com" }
      ]
    }
    `;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    
    // Limpeza de potenciais blocos markdown devolvidos pela IA
    const cleanJson = responseText.replace(/```json|```/g, "").trim();
    const parsedData = JSON.parse(cleanJson);

    return res.status(200).json(parsedData);
  } catch (error) {
    console.error("Erro no processamento da IA Gemini:", error);
    return res.status(500).json({ error: "Falha ao analisar a notícia com IA. Verifique as credenciais da API." });
  }
}