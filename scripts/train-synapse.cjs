const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const {features, classify} = require('../public/synapse.js');
const {train, test} = require('./synapse-examples.json');

const vocabulary = new Set();
const classes = Object.entries(train).map(([name,examples]) => {
  const counts = Object.create(null);
  let total = 0;
  for (const example of examples) for (const token of features(example)) {
    vocabulary.add(token);
    counts[token] = (counts[token] || 0) + 1;
    total++;
  }
  return {name, counts, total};
});
const model = { vocabularySize: vocabulary.size, classes };
const checks = Object.entries(test).flatMap(([expected, questions]) =>
  questions.map(question => ({question, expected, actual:classify(question,model)?.name})));
const missed = checks.filter(test => test.actual !== test.expected);
const correct = checks.length - missed.length;
assert(correct/checks.length >= .80, JSON.stringify(missed));
assert.equal(classify('Как приготовить оладьи с яблоками?', model), null);
const filename = path.join(__dirname,'../public/synapse-model.json');
fs.writeFileSync(filename,JSON.stringify(model)+'\n');
console.log(JSON.stringify({training:Object.values(train).flat().length, evaluation:checks.length, correct, missed}));
