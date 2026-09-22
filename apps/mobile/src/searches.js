
import * as SecureStore from "expo-secure-store";
const KEY="groona_recent_searches";
const MAX=8;
// 최근 검색어는 기기에만 남는다. 저장소를 못 읽으면 빈 목록으로 떨어져 화면이 깨지지 않게 한다.
export async function getSearches(){
 try{
  const v=JSON.parse((await SecureStore.getItemAsync(KEY))||"[]");
  return Array.isArray(v)?v.filter(x=>typeof x==="string"&&x.trim()).slice(0,MAX):[];
 }catch(e){return []}
}
export async function pushSearch(term){
 const t=String(term||"").trim();
 if(!t)return await getSearches();
 try{
  const next=[t,...(await getSearches()).filter(x=>x!==t)].slice(0,MAX);  // 맨 앞 + 중복 제거 + 최대 8개
  await SecureStore.setItemAsync(KEY,JSON.stringify(next));
  return next;
 }catch(e){return []}
}
export async function removeSearch(term){
 try{
  const next=(await getSearches()).filter(x=>x!==term);
  await SecureStore.setItemAsync(KEY,JSON.stringify(next));
  return next;
 }catch(e){return []}
}
export async function clearSearches(){
 try{await SecureStore.deleteItemAsync(KEY)}catch(e){}
 return [];
}
