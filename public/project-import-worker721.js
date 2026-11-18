'use strict';

self.onmessage=async({data:file})=>{
  try{
    if(!(file instanceof Blob)||file.size>300*1024*1024)throw Error('Файл больше 300 МБ или имеет неподдерживаемый формат');
    const project=JSON.parse(await file.text(),(key,value)=>
      ['__proto__','prototype','constructor'].includes(key)?undefined:value);
    postMessage({project});
  }catch(error){
    postMessage({error:error instanceof SyntaxError?'Некорректный JSON':error.message||'Не удалось прочитать проект'});
  }
};
