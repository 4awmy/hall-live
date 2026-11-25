import { readFileSync } from 'node:fs';

const chapters = ['O', 'A', 'S', 'L', 'D', 'C'];
const debateChoices = ['Strongly agree', 'Agree', 'Unsure', 'Disagree', 'Strongly disagree'];

function screenText(markdown) {
  return markdown.split('\n').map(line => line
    .replace(/^> /, '')
    .replace(/^[-*] /, '• ')
    .replace(/^\*\*Below:\*\*\s*/, '')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\`([^`]+)\`/g, '$1')
    .trimEnd()).join('\n').trim();
}

export function loadDeck() {
  const master = readFileSync(new URL('AI_Event_Presentation_Master.md', import.meta.url), 'utf8').replace(/\r\n/g, '\n');
  const [presentation, prediction, debate, handoff, sources] = master.split(/^# Appendix [A-D] — /m);
  const headings = [...presentation.matchAll(/^#{1,2} (?:Closing slide )?([OASLDC]\d{2}) — (.*?) \| (.+)$/gm)];
  const rounds = [...prediction.matchAll(/^\| (\d) \| (.*?) \| (.*?) \| (.*?) \|$/gm)];
  return headings.flatMap(([heading, id, title, timing], index) => {
    const start = headings[index].index + heading.length;
    const content = presentation.slice(start, headings[index + 1]?.index)
      .split(/^---$|^# Chapter /m)[0].trim();
    // Blank lines are allowed in screen copy, including before lists and code.
    const screen = content.match(/^\*\*On screen:\*\*([\s\S]*)$/m)?.[1];
    if (!screen?.trim()) throw new Error('Missing screen copy for ' + id);
    const boundary = screen.search(/\n\n\*\*(?!Below:)/);
    const publicCopy = boundary < 0 ? screen : screen.slice(0, boundary);
    const notes = boundary < 0 ? '' : screen.slice(boundary).trim();
    const entry = {
      id, section: chapters.indexOf(id[0]), title, body: screenText(publicCopy),
      options: [], notes, timing, revision: 0
    };
    if (id === 'O02') {
      return [{...entry, notes: notes + '\n\n' + prediction.trim()}, ...rounds.map(([, round, prompt, choices, teachingPoint]) => ({
        ...entry, id: 'predict-0' + round, title: 'Predict the next word · Round ' + round,
        body: prompt, options: choices.split(' / '), notes: teachingPoint, timing: '1 min'
      }))];
    }
    if (id === 'D01') return [{...entry, notes: notes + '\n\n' + debate.trim()}];
    if (id === 'C01') return [{...entry, notes: [notes, handoff.trim(), sources.trim()].join('\n\n')}];
    if (/^D0[234]$/.test(id)) {
      const motion = 'debate-0' + (Number(id[2]) - 1);
      return ['pre', 'post'].map(phase => ({
        ...entry, id: motion + '-' + phase,
        title: 'Motion ' + (Number(id[2]) - 1) + ' · ' + (phase === 'pre' ? 'First vote' : 'Second vote'),
        options: debateChoices
      }));
    }
    return [entry];
  });
}
