"use client";

import { useState } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import TranslatableText from '@/components/ui/TranslatableText';
import { useTranslation } from '@/hooks/useTranslation';
import { Button } from '@/components/ui/button';

export default function TestTranslationPage() {
  const { language, setLanguage } = useLanguage();
  const { translate, isTranslating, shouldTranslate } = useTranslation();
  const [testResult, setTestResult] = useState<string>('');
  const [apiTestResult, setApiTestResult] = useState<any>(null);

  const handleDirectTranslation = async () => {
    const result = await translate('Hello, world!');
    setTestResult(result);
  };

  const handleApiTest = async () => {
    try {
      const response = await fetch('/api/translate/test');
      const data = await response.json();
      setApiTestResult(data);
    } catch (error) {
      setApiTestResult({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  };

  const handleApiTranslation = async () => {
    try {
      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: 'Hello, world!',
          targetLanguage: language,
        }),
      });
      const data = await response.json();
      setTestResult(data.translatedText || data.error || 'No response');
    } catch (error) {
      setTestResult(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  return (
    <div className="container mx-auto p-8 max-w-4xl space-y-8">
      <h1 className="text-3xl font-bold mb-8">Translation Test Page</h1>

      {/* Current Language */}
      <section className="border p-4 rounded">
        <h2 className="text-xl font-semibold mb-4">Current Language</h2>
        <p>Selected: <strong>{language}</strong></p>
        <p>Should Translate: <strong>{shouldTranslate ? 'Yes' : 'No'}</strong></p>
        <p>Is Translating: <strong>{isTranslating ? 'Yes' : 'No'}</strong></p>
        <div className="mt-4">
          <label className="block mb-2">Change Language:</label>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="border rounded px-3 py-2"
          >
            <option value="en">English</option>
            <option value="es">Spanish</option>
            <option value="fr">French</option>
            <option value="de">German</option>
            <option value="it">Italian</option>
          </select>
        </div>
      </section>

      {/* API Setup Test */}
      <section className="border p-4 rounded">
        <h2 className="text-xl font-semibold mb-4">1. API Setup Test</h2>
        <Button onClick={handleApiTest} className="mb-4">
          Test API Configuration
        </Button>
        {apiTestResult && (
          <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
            {JSON.stringify(apiTestResult, null, 2)}
          </pre>
        )}
      </section>

      {/* Direct API Translation */}
      <section className="border p-4 rounded">
        <h2 className="text-xl font-semibold mb-4">2. Direct API Translation</h2>
        <Button onClick={handleApiTranslation} className="mb-4">
          Translate via API
        </Button>
        {testResult && (
          <p className="mt-4">
            Result: <strong>{testResult}</strong>
          </p>
        )}
      </section>

      {/* Hook Translation */}
      <section className="border p-4 rounded">
        <h2 className="text-xl font-semibold mb-4">3. Hook Translation</h2>
        <Button onClick={handleDirectTranslation} className="mb-4">
          Translate via Hook
        </Button>
        {testResult && (
          <p className="mt-4">
            Result: <strong>{testResult}</strong>
          </p>
        )}
      </section>

      {/* Component Translation */}
      <section className="border p-4 rounded">
        <h2 className="text-xl font-semibold mb-4">4. Component Translation</h2>
        <p className="mb-4">These should translate when you change the language:</p>
        <div className="space-y-2">
          <p><TranslatableText text="Hello, world!" /></p>
          <p><TranslatableText text="Welcome to our store" /></p>
          <p><TranslatableText text="Add to Cart" /></p>
          <p><TranslatableText text="Shop" /></p>
          <p><TranslatableText text="About" /></p>
        </div>
      </section>

      {/* Instructions */}
      <section className="border p-4 rounded bg-blue-50">
        <h2 className="text-xl font-semibold mb-4">How to Test</h2>
        <ol className="list-decimal list-inside space-y-2">
          <li>Click "Test API Configuration" - should show all checks passing</li>
          <li>Click "Translate via API" - should return translated text</li>
          <li>Change language dropdown to Spanish/French/German</li>
          <li>Watch the "Component Translation" section - text should change</li>
          <li>Check browser console (F12) for [Translation] logs</li>
        </ol>
      </section>
    </div>
  );
}



















