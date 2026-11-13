export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { text, tone } = req.body;

    if (!text) {
        return res.status(400).json({ error: 'النص مطلوب' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        return res.status(500).json({ error: 'مفتاح الـ API غير معرّف في النظام' });
    }

    try {
        const systemPrompt = `أنت خبير في الصياغة اللغوية والبلاغة وتحسين النصوص. مهمتك استقبال نص المستخدم وإعادة صياغته بدقة حسب النبرة المطلوبة: "${tone}". الحفاظ على المعنى الأصلي وتقوية أسلوبه. قدم دائماً 3 خيارات متنوعة في الصياغة. أعد النتيجة بصيغة JSON فقط بهذا الشكل وبدون أي نص إضافي أو علامات تنسيق الكود: {"options": ["الخيار الأول", "الخيار الثاني", "الخيار الثالث"]}`;

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: `${systemPrompt}\n\nالنص المراد تحسينه: ${text}` }]
                }],
                generationConfig: {
                    responseMimeType: "application/json"
                }
            })
        });

        const data = await response.json();
        
        if (data.candidates && data.candidates[0].content) {
            const rawText = data.candidates[0].content.parts[0].text;
            const parsedData = JSON.parse(rawText);
            return res.status(200).json(parsedData);
        } else {
            throw new Error('فشل في توليد الرد من نموذج الذكاء الاصطناعي');
        }

    } catch (error) {
        return res.status(500).json({ error: 'حدث خطأ أثناء معالجة الطلب', details: error.message });
    }
}
