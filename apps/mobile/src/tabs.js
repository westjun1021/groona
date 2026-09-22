
import {useEffect} from "react";
import {useNavigation} from "expo-router";
// 이미 열려 있는 탭을 다시 누르면 그 목록을 맨 위로 올린다.
// 다른 탭에서 넘어오는 경우에는 그 화면이 아직 focus 되어 있지 않으므로 아무 일도 하지 않는다.
export function useScrollTopOnRetap(ref){
 const navigation=useNavigation();
 useEffect(()=>{
  const unsub=navigation.addListener("tabPress",()=>{
   if(!navigation.isFocused())return;
   const list=ref.current;
   if(list&&list.scrollToOffset)list.scrollToOffset({offset:0,animated:true});
  });
  return unsub;
 },[navigation,ref]);
}
