/*
This benchmark was created to see which way to parse filter options is faster.

Tested with https://jsbench.me/.

case 1, regex, was the winner.
*/


// setup
const string = 'boards:v;op:only';


// case 1
const a = string.match(/(?:^|;)\s*boards:([^;]+)/)?.[1];
const b = string.match(/(?:^|;)\s*op:(no|only)/)?.[1];
const c = string.match(/(?:^|;)\s*stub:(yes|no)/)?.[1];


// case 2
const m = new Map(string.split(';').map(s => s.split(':')));
const a = m.get('boards');
const b = m.get('op');
const c = m.get('stub');


// case 3
const m = new Map();
string.split(';').forEach(s => {
	const v = s.split(':');
	m.set(v[0], v[1]);
});
const a = m.get('boards');
const b = m.get('op');
const c = m.get('stub');