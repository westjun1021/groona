
import {useEffect,useState,useCallback} from "react";
import {router} from "expo-router";
import {api,token} from "./api";
// 목록/상세 화면이 공유하는 찜 상태. 비로그인이면 하트를 눌렀을 때 /login 으로 유도한다.
export function useFavorites(){
 const [ids,setIds]=useState(()=>new Set()),[logged,setLogged]=useState(false);
 const reload=useCallback(async()=>{
  const t=await token();setLogged(!!t);
  if(!t){setIds(new Set());return}
  try{const r=await api.favorites();setIds(new Set(r.items||[]))}catch(e){setIds(new Set())}
 },[]);
 useEffect(()=>{reload()},[reload]);
 const toggle=useCallback(async(id)=>{
  if(!(await token())){router.push("/login");return}
  try{const r=await api.toggleFavorite(id);setIds(p=>{const n=new Set(p);r.favorite?n.add(id):n.delete(id);return n})}catch(e){}
 },[]);
 return {ids,logged,toggle,reload};
}
