import {loadDeck} from './deck.mjs';
export function loadPresentation(){
 const deck=loadDeck();
 deck.unshift(
  {id:'welcome',section:0,title:'Hello, everyone.',body:'Glad you’re here. Let’s talk about AI.',visual:'hello',options:[],revision:0},
  {id:'farewell',section:0,title:'Before we start…',body:'We’d like to say our farewells to…',visual:'farewell',options:[],revision:0},
  {id:'in-memoriam',section:0,title:'Gone from our tabs. Never from our hearts.',body:'A moment of silence for our old research habits.',visual:'memorial',options:[],revision:0}
 );
 const update=(id,patch)=>Object.assign(deck.find(s=>s.id===id),patch);
 const extra=(after,slide)=>deck.splice(deck.findIndex(s=>s.id===after)+1,0,{body:'',options:[],revision:0,...slide});
 update('O01',{title:'AI changed the rules. What will you do?',body:'Omar × Ezzat\nAn interactive conversation about building, learning and thinking with AI.',visual:'cover'});
 update('O03',{title:'You just predicted the next token.',body:'A language model generates a continuation from context. A token may be a word, part of a word, or punctuation.',visual:'prediction'});
 extra('O03',{id:'O-map',section:0,title:'A map, before the jargon.',body:'AI is the broad field. Machine learning learns patterns from data. Deep learning uses multilayer neural networks. Many modern LLMs sit within deep learning.',visual:'taxonomy'});
 update('O05',{title:'From giving answers to taking actions.',body:'Add tools, context and a feedback loop. Now the model can choose a next step within the permissions you give it.',visual:'agent'});
 update('A02',{title:'A goal. A tool. A loop.',body:'An agent can choose actions, inspect the outcome and adapt. A fixed workflow follows a predefined path. Neither removes the need for human judgment.',visual:'agent'});
 update('A03',{title:'Context is part of the job.',body:'Give the goal, relevant files, constraints and a definition of done. Ask the model to surface missing information before it starts.',visual:'context'});
 update('A04',{title:'MCP connects the tools.',body:'An application connects through MCP clients to servers that expose tools and resources. Access still depends on authorization.',visual:'mcp'});
 update('A05',{title:'Skills carry the playbook.',body:'Reusable instructions and supporting resources describe how to do a task. MCP connects capabilities; skills package a way of working.',visual:'skill'});
 extra('A05',{id:'A-workflow',section:1,title:'Start small. Make the loop visible.',body:'Pick a bounded change. Agree on success. Read the relevant files. Review a plan. Make the change. Check the result before shipping.',visual:'workflow'});
 extra('A-workflow',{id:'A-poll',section:1,title:'Where would you bring AI into your workflow?',body:'Pick the step where assistance would help you most.',options:['Understanding unfamiliar code','Planning a change','Writing an implementation','Testing and reviewing']});
 update('S02',{title:'The SDLC still exists. The work shifts.',body:'AI can help throughout the cycle. People still set goals, make trade-offs, verify behavior and own the release.',visual:'sdlc'});
 extra('S03',{id:'S-claude',section:2,title:'A prepared Claude walkthrough.',body:'Illustrative example, not a live AI response: “Add one vote per browser per round. Inspect the code, propose a plan, then wait. Explain the limitation of browser-based identity.”',visual:'claude'});
 update('S04',{options:['Duplicate votes','A dropped connection','Unauthorized poll controls','All of these'],body:'A voting site looks simple. Which failure would you check before the audience joins?'});
 update('L01',{title:'The assignment is done. Did you learn?',body:'If AI helped you solve a problem today, could you solve a similar one on your own tomorrow?',options:['I could explain and rebuild it','I understand it with the answer open','I would need AI again','I have not checked']});
 extra('L02',{id:'L-self',section:3,title:'Make learning a SELF loop.',body:'Select a useful skill. Extract the idea. Live it through practice. Forge it through variations and feedback.',visual:'self'});
 extra('L-self',{id:'L-select',section:3,title:'Select one problem worth solving.',body:'“I want to build a quiz. I know variables and conditions. Ask me questions to find my gaps before suggesting the next exercise.”',visual:'select'});
 extra('L-select',{id:'L-extract',section:3,title:'Close the answer. Explain the idea.',body:'Rewrite the explanation in your own words. Ask AI to challenge your reasoning. Test the example against what you expect.',visual:'extract'});
 update('L03',{title:'Live it: predict, then change it.',body:'What does this return for [3, 8, 2, 9]?\n\n```python\ndef count_large(values):\n    count = 0\n    for value in values:\n        if value > 5:\n            count += 1\n    return count\n```',options:['2','8','9','17']});
 extra('L03',{id:'L-forge',section:3,title:'Forge it: solve the variation.',body:'Now add the values above five instead of counting them. Explain which line changes. Tomorrow, try a new example without reopening the chat.',visual:'forge'});
 update('L05',{title:'Ask for a hint. Keep the thinking.',body:'Try first. Ask for one hint. Explain your solution. Solve a fresh problem independently. Revisit it later.',visual:'practice'});
 update('D01',{title:'Is coding dead?',body:'Define what you mean by coding. Writing syntax? Debugging? Designing systems? Then vote, hear both sides and vote again.',visual:'debate'});
 for(const phase of ['pre','post'])update('debate-02-'+phase,{body:'“AI makes learning to write code unnecessary.”'});
 update('C01',{title:'Build with AI. Keep your judgment.',body:'Omar: give tools clear goals and verify their work.\nEzzat: measure learning by what you can do after closing the chat.\nTomorrow: solve a variation of one problem you solved with AI today.',visual:'closing'});
 return deck;
}
