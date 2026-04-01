export interface Message {
  sender: 'trainer' | 'client';
  content: string;
  type: MessageType;
}

export type MessageType =
  | 'welcome'
  | 'checkin'
  | 'feedback'
  | 'pr_celebration'
  | 'form_tips'
  | 'adjustment'
  | 'motivation'
  | 'recovery'
  | 'weekly_summary';

export interface MessageOptions {
  day: number;
  isWorkoutDay: boolean;
  trainerName: string;
  clientName: string;
  hasPR?: boolean;
  exerciseName?: string;
  isProgramAdjusted?: boolean;
}

const TRAINER_TEMPLATES: Record<MessageType, string[]> = {
  welcome: [
    "Welcome to your 14-day transformation journey! I'm excited to work with you.",
    "Hey {clientName}! Ready to get stronger? Your program is all set."
  ],
  checkin: [
    "How are you feeling about today's session?",
    "Checking in! How's your energy today?"
  ],
  feedback: [
    "Great work today! Your form was solid.",
    "Nice session! I noticed you pushed through those last reps."
  ],
  pr_celebration: [
    "🎉 NEW PR on {exerciseName}! That's incredible progress!",
    "CRUSHING IT! New personal record on {exerciseName}!"
  ],
  form_tips: [
    "Quick tip: Focus on driving through your heels on the squat.",
    "For tomorrow's session, really emphasize the mind-muscle connection."
  ],
  adjustment: [
    "Based on your feedback, I've adjusted next week's weights.",
    "I noticed you mentioned the volume was high, so I've tweaked the next sessions."
  ],
  motivation: [
    "You're doing amazing! Keep showing up - that's 90% of the battle!",
    "Every rep is a step closer to your goals."
  ],
  recovery: [
    "Rest day! Make sure you're getting good sleep and staying hydrated.",
    "How's the soreness today? Light stretching can help with recovery."
  ],
  weekly_summary: [
    "Week 1 complete! You logged {workouts} workouts and hit {prs} PRs.",
    "Incredible first week! Your consistency is spot-on."
  ]
};

const CLIENT_TEMPLATES: Record<MessageType, string[]> = {
  welcome: [
    "Thanks Coach! I'm ready to get started!",
    "Excited to begin! Let's do this!"
  ],
  checkin: [
    "Feeling good today! Ready to lift!",
    "A bit tired but ready to work!"
  ],
  feedback: [
    "Thanks! I felt really good about that session.",
    "Appreciate the feedback! I'll focus on that next time."
  ],
  pr_celebration: [
    "Thank you! I couldn't believe it when I hit that!",
    "So pumped right now! Thanks for the program!"
  ],
  form_tips: [
    "Got it! I'll focus on that cue.",
    "Thanks for the tip - that helps a lot!"
  ],
  adjustment: [
    "Thanks for adjusting! I appreciate you listening to my feedback.",
    "Perfect timing on that change. I was feeling a bit beat up."
  ],
  motivation: [
    "Thank you! Your support means a lot!",
    "Needed to hear that today - thanks!"
  ],
  recovery: [
    "Soreness is manageable. Sleep was good last night!",
    "Feeling the DOMS today but in a good way!"
  ],
  weekly_summary: [
    "Week 1 done! Feeling stronger already!",
    "Thanks for the summary! Didn't realize I hit that many PRs!"
  ]
};

function pickRandom(templates: string[]): string {
  return templates[Math.floor(Math.random() * templates.length)];
}

function interpolate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (_, key) => vars[key] || `{${key}}`);
}

export function generateDailyMessages(options: MessageOptions): Message[] {
  const { day, isWorkoutDay, trainerName, clientName, hasPR, exerciseName, isProgramAdjusted } = options;
  const messages: Message[] = [];
  const vars = { trainerName, clientName, exerciseName: exerciseName || '' };

  // Day 1: Welcome messages
  if (day === 1) {
    messages.push({ sender: 'trainer', content: interpolate(pickRandom(TRAINER_TEMPLATES.welcome), vars), type: 'welcome' });
    messages.push({ sender: 'client', content: interpolate(pickRandom(CLIENT_TEMPLATES.welcome), vars), type: 'welcome' });
  }

  // Workout day flow
  if (isWorkoutDay) {
    messages.push({ sender: 'trainer', content: interpolate(pickRandom(TRAINER_TEMPLATES.checkin), vars), type: 'checkin' });
    messages.push({ sender: 'client', content: interpolate(pickRandom(CLIENT_TEMPLATES.checkin), vars), type: 'checkin' });

    if (hasPR && exerciseName) {
      messages.push({ sender: 'trainer', content: interpolate(pickRandom(TRAINER_TEMPLATES.pr_celebration), vars), type: 'pr_celebration' });
      messages.push({ sender: 'client', content: interpolate(pickRandom(CLIENT_TEMPLATES.pr_celebration), vars), type: 'pr_celebration' });
    } else {
      messages.push({ sender: 'trainer', content: interpolate(pickRandom(TRAINER_TEMPLATES.feedback), vars), type: 'feedback' });
      messages.push({ sender: 'client', content: interpolate(pickRandom(CLIENT_TEMPLATES.feedback), vars), type: 'feedback' });
    }
  } else {
    // Rest day
    messages.push({ sender: 'trainer', content: interpolate(pickRandom(TRAINER_TEMPLATES.recovery), vars), type: 'recovery' });
    messages.push({ sender: 'client', content: interpolate(pickRandom(CLIENT_TEMPLATES.recovery), vars), type: 'recovery' });
  }

  // Program adjustment notification
  if (isProgramAdjusted) {
    messages.push({ sender: 'trainer', content: interpolate(pickRandom(TRAINER_TEMPLATES.adjustment), vars), type: 'adjustment' });
    messages.push({ sender: 'client', content: interpolate(pickRandom(CLIENT_TEMPLATES.adjustment), vars), type: 'adjustment' });
  }

  // Weekly summary (Day 7 and Day 14)
  if (day === 7 || day === 14) {
    const workouts = day === 7 ? 4 : 8;
    const prs = day === 7 ? 2 : 6;
    const summaryVars = { ...vars, workouts: workouts.toString(), prs: prs.toString() };
    messages.push({ sender: 'trainer', content: interpolate(pickRandom(TRAINER_TEMPLATES.weekly_summary), summaryVars), type: 'weekly_summary' });
    messages.push({ sender: 'client', content: interpolate(pickRandom(CLIENT_TEMPLATES.weekly_summary), summaryVars), type: 'weekly_summary' });
  }

  return messages;
}

export function generateMessageStats(messages: Message[]): {
  total: number;
  trainer: number;
  client: number;
  byType: Partial<Record<MessageType, number>>;
} {
  const byType: Partial<Record<MessageType, number>> = {};
  messages.forEach(m => {
    byType[m.type] = (byType[m.type] || 0) + 1;
  });

  return {
    total: messages.length,
    trainer: messages.filter(m => m.sender === 'trainer').length,
    client: messages.filter(m => m.sender === 'client').length,
    byType
  };
}
