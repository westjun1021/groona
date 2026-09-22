
import React,{useCallback,useMemo,useRef,useState} from "react";
import {SafeAreaView,FlatList,Text,View,StyleSheet,RefreshControl} from "react-native";
import {router,useFocusEffect} from "expo-router";
import {api,token} from "../../src/api";import {useTheme} from "../../src/theme";import ActivityCard from "../../src/ActivityCard";
import {ListSkeleton,Empty,friendlyError,alertError,useToast} from "../../src/ui";import {useScrollTopOnRetap} from "../../src/tabs";
export default function Favorites(){
 const {C}=useTheme();const s=useMemo(()=>styles(C),[C]);
 const toast=useToast();
 const listRef=useRef(null);
 useScrollTopOnRetap(listRef);
 const [rows,setRows]=useState([]),[logged,setLogged]=useState(false);
 const [loading,setLoading]=useState(true),[refreshing,setRefreshing]=useState(false),[error,setError]=useState(null);
 const load=useCallback(async()=>{
  try{
   const t=await token();setLogged(!!t);
   if(!t){setRows([]);setError(null);return}
   const ids=(await api.favorites()).items||[];
   const items=await Promise.all(ids.map(id=>api.activity(id).catch(()=>null)));
   setRows(items.filter(Boolean));setError(null);
  }catch(e){setError(friendlyError(e));setRows([])}
 },[]);
 useFocusEffect(useCallback(()=>{setLoading(true);load().finally(()=>setLoading(false))},[load]));
 const onRefresh=useCallback(async()=>{setRefreshing(true);await load();setRefreshing(false)},[load]);
 async function toggle(id){
  const prev=rows;setRows(p=>p.filter(x=>x.id!==id));
  try{await api.toggleFavorite(id);toast("찜을 해제했어요")}catch(e){setRows(prev);alertError(e,"찜을 변경하지 못했어요")}
 }
 const header=<View><Text style={s.title}>찜한 프로그램</Text><Text style={s.desc}>관심 있는 활동을 저장해 두고 언제든 다시 확인하세요.</Text>{!loading&&logged&&rows.length>0?<Text style={s.count}>{rows.length}개</Text>:null}</View>;
 return <SafeAreaView style={s.safe}>
  <FlatList
   ref={listRef}
   data={loading?[]:rows}
   keyExtractor={x=>x.id}
   renderItem={({item})=><ActivityCard x={item} favorite onToggleFavorite={toggle}/>}
   ListHeaderComponent={header}
   ListEmptyComponent={loading?<ListSkeleton count={3}/>
    :error?<Empty title="정보를 불러오지 못했어요" desc={error} actionLabel="다시 시도" onAction={()=>{setLoading(true);load().finally(()=>setLoading(false))}}/>
    :!logged?<Empty title="로그인이 필요해요" desc="로그인하면 찜한 프로그램을 저장할 수 있습니다." actionLabel="로그인 / 보호자 가입" onAction={()=>router.push("/login")}/>
    :<Empty title="아직 찜한 프로그램이 없어요" desc="탐색에서 하트(♡)를 눌러 저장해 보세요." actionLabel="지역 프로그램 탐색" onAction={()=>router.push("/explore")}/>}
   refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.blue}/>}
   contentContainerStyle={s.content}
  />
 </SafeAreaView>
}
const styles=C=>StyleSheet.create({safe:{flex:1,backgroundColor:C.bg},content:{padding:16,paddingBottom:100},title:{fontSize:26,fontWeight:"900",color:C.navy},desc:{fontSize:11.5,color:C.muted,lineHeight:19,marginTop:5,marginBottom:14},count:{fontSize:10.5,color:C.muted,marginBottom:9}});
