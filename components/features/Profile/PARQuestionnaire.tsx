'use client';

import React from 'react';

/** A single PAR-Q question definition. */
export interface PARQuestion {
  id: string;
  question: string;
}

/** The 7 standard PAR-Q questions. */
export const PAR_Q_QUESTIONS: PARQuestion[] = [
  {
    id: 'q1',
    question: 'Has your doctor ever said you have a heart condition?',
  },
  {
    id: 'q2',
    question: 'Do you feel pain in your chest when you do physical activity?',
  },
  {
    id: 'q3',
    question: 'Have you had chest pain when NOT doing physical activity?',
  },
  {
    id: 'q4',
    question:
      'Do you lose balance because of dizziness or lose consciousness?',
  },
  {
    id: 'q5',
    question:
      'Do you have a bone or joint problem that could be worsened by exercise?',
  },
  {
    id: 'q6',
    question:
      'Is your doctor currently prescribing medications for blood pressure or heart condition?',
  },
  {
    id: 'q7',
    question:
      'Do you know of any other reason why you should not do physical activity?',
  },
];

/** Possible response values for each PAR-Q question. */
export type PARResponse = 'yes' | 'no' | 'unsure';

/** Map of question ID to response value. */
export type PARQResponses = Partial<Record<string, PARResponse>>;

interface PARQuestionnaireProps {
  /** Current set of responses keyed by question ID. */
  responses: PARQResponses;
  /** Callback fired with the full updated responses object on any change. */
  onChange: (responses: PARQResponses) => void;
}

const RESPONSE_OPTIONS: { value: PARResponse; label: string }[] = [
  { value: 'yes', label: 'Yes' },
  { value: 'no', label: 'No' },
  { value: 'unsure', label: 'Unsure' },
];

/**
 * PARQuestionnaire — renders the 7 standard PAR-Q health screening questions.
 * Each question offers yes/no/unsure toggle buttons.
 * Displays a doctor-consultation warning if any answer is "yes".
 */
export default function PARQuestionnaire({ responses, onChange }: PARQuestionnaireProps) {
  const hasYesAnswer = Object.values(responses).some(v => v === 'yes');

  const handleSelect = (questionId: string, value: PARResponse) => {
    onChange({ ...responses, [questionId]: value });
  };

  return (
    <div className="space-y-4">
      {PAR_Q_QUESTIONS.map((q, index) => {
        const current = responses[q.id];
        return (
          <fieldset
            key={q.id}
            role="group"
            aria-labelledby={`parq-label-${q.id}`}
            className="border border-gray-200 rounded-lg p-4"
          >
            <legend
              id={`parq-label-${q.id}`}
              className="text-sm font-medium text-gray-800 px-1"
            >
              <span className="text-gray-500 mr-2">{index + 1}.</span>
              {q.question}
            </legend>
            <div className="flex space-x-2 mt-3">
              {RESPONSE_OPTIONS.map(opt => {
                const isSelected = current === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => handleSelect(q.id, opt.value)}
                    className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 ${
                      isSelected
                        ? opt.value === 'yes'
                          ? 'bg-red-600 text-white border-red-600'
                          : opt.value === 'no'
                          ? 'bg-green-600 text-white border-green-600'
                          : 'bg-gray-500 text-white border-gray-500'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </fieldset>
        );
      })}

      {hasYesAnswer && (
        <div className="flex items-start space-x-3 p-4 bg-amber-50 border border-amber-300 rounded-lg">
          <svg
            className="w-5 h-5 text-amber-600 mt-0.5 shrink-0"
            fill="currentColor"
            viewBox="0 0 20 20"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z"
              clipRule="evenodd"
            />
          </svg>
          <p className="text-sm text-amber-800 font-medium">
            Consult your doctor before starting an exercise program.
            One or more of your answers suggests a medical evaluation may be needed before you become more physically active.
          </p>
        </div>
      )}
    </div>
  );
}
