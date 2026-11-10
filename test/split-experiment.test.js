import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import { formatHex, customColorFrames } from '../protocol.js';
import { lengthFrame, validateSplit, splitPlan, localCountStorage } from '../split-experiment.js';

test('SET_LENGTH encodes documented BC 03 02 frame', () => {
  assert.equal(formatHex(lengthFrame(8)), 'BC 03 02 00 08 55');
  assert.equal(formatHex(lengthFrame(150)), 'BC 03 02 00 96 55');
  assert.equal(formatHex(lengthFrame(300)), 'BC 03 02 01 2C 55');
  for(const n of [0,7,301,1.5,NaN,'100'])assert.throws(()=>lengthFrame(n), RangeError);
});
test('Guard rejects unknown or mismatched split lengths', () => {
  assert.equal(validateSplit(300,150),150);
  for (const [a,b] of [[8,4],[301,150],[100,100],[100,101],[100,7],[0,9],[100,2.5]]) {
    assert.throws(()=>validateSplit(a,b), RangeError);
  }
});
test('Three documented strategies use ordered color, length, color frames', () => {
 const params = {original:300,split:150,prefix:'#FF0000',tail:'#0000FF'};
 const red=customColorFrames(params.prefix).color,blue=customColorFrames(params.tail).color,len=lengthFrame(150);
 assert.deepEqual(splitPlan(params,'normal').frames,[blue,len,red]);
 assert.deepEqual(splitPlan(params,'reversed').frames,[red,len,blue]);
 assert.deepEqual(splitPlan(params,'probe').frames,[blue,len,blue]);
 assert.throws(()=>splitPlan(params,'unknown'),RangeError);
});
test('Original count storage does not guess and can restore across sessions', () => {
 const map=new Map();
 const get=()=>({getItem:k=>map.get(k)??null,setItem:(k,v)=>map.set(k,v)});
 const state=localCountStorage(get);
 assert.equal(state.load(),null);
 state.save(300);
 assert.equal(localCountStorage(get).load(),300);
 assert.throws(()=>state.save(301),RangeError);
});
test('Experimental UI requires manual confirmation and has restore controls', () => {
 const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
 const app=readFileSync(new URL('../app.js',import.meta.url),'utf8');
 for(const id of ['original-count','split-count','count-confirmed','store-count','restore-count','restore-full','try-split','try-reversed','probe-length'])
 assert.match(html,new RegExp('id="'+id+'"'));
 assert.match(app,/verifiedOriginal === null \|\| !countConfirmed.checked/);
 assert.match(app,/originalStorage.save\(count\)/);
 assert.match(app,/\[lengthFrame\(verifiedOriginal\)\]/);
});
