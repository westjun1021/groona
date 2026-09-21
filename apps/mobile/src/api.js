
import * as SecureStore from "expo-secure-store";
export const API=process.env.EXPO_PUBLIC_API_BASE_URL || "http://127.0.0.1:8787";
// 공유 링크용 공개 웹 주소. 지정하지 않으면 API 서버가 같은 페이지를 서빙하므로 API 주소를 쓴다.
export const WEB=process.env.EXPO_PUBLIC_WEB_BASE_URL || API;
export async function token(){ return await SecureStore.getItemAsync("groona_token"); }
export async function setToken(v){ if(v) await SecureStore.setItemAsync("groona_token",v); else await SecureStore.deleteItemAsync("groona_token"); }
export async function request(path,options={}){
  const t=await token();
  const headers={"Content-Type":"application/json",...(options.headers||{})};
  if(t) headers.Authorization=`Bearer ${t}`;
  const r=await fetch(API+path,{...options,headers});
  const data=await r.json().catch(()=>({}));
  if(!r.ok) throw new Error(data.detail||`HTTP ${r.status}`);
  return data;
}
export const api={
  activities:(qs="")=>request(`/activities${qs?`?${qs}`:""}`),
  activity:(id)=>request(`/activities/${id}`),
  sources:()=>request("/sources"),
  register:(email,password)=>request("/auth/register",{method:"POST",body:JSON.stringify({email,password})}),
  login:(email,password)=>request("/auth/login",{method:"POST",body:JSON.stringify({email,password})}),
  me:()=>request("/me"),
  children:()=>request("/me/children"),
  addChild:(body)=>request("/me/children",{method:"POST",body:JSON.stringify(body)}),
  favorites:()=>request("/me/favorites"),
  toggleFavorite:(activityId)=>request(`/me/favorites/${activityId}`,{method:"POST"}),
  complete:(activityId,childId)=>request("/me/history",{method:"POST",body:JSON.stringify({activity_id:activityId,child_id:childId})}),
  growth:()=>request("/me/growth"),
  registerPush:(token,platform)=>request("/me/push",{method:"POST",body:JSON.stringify({token,platform})}),
  deleteAccount:()=>request("/me",{method:"DELETE"})
};
