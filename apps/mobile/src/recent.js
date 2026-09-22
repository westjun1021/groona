
import * as SecureStore from "expo-secure-store";
const KEY="groona_recent_activities";
const MAX=20;
// 최근 본 프로그램은 기기에만 남는다(서버 저장 없음). 저장소를 못 읽어도 화면은 그냥 비어 보이게 한다.
export async function getRecentIds(){
 try{
  const v=JSON.parse((await SecureStore.getItemAsync(KEY))||"[]");
  return Array.isArray(v)?v.filter(x=>typeof x==="string"&&x):[];
 }catch(e){return []}
}
export async function pushRecentId(id){
 if(!id)return [];
 const key=String(id);
 try{
  const next=[key,...(await getRecentIds()).filter(x=>x!==key)].slice(0,MAX);  // 맨 앞 추가 + 중복 제거 + 최대 20개
  await SecureStore.setItemAsync(KEY,JSON.stringify(next));
  return next;
 }catch(e){return []}
}
export async function clearRecent(){
 try{await SecureStore.deleteItemAsync(KEY)}catch(e){}
}
