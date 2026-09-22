
import React,{useMemo,useRef} from "react";
import {Animated,View,Text,TouchableOpacity,StyleSheet} from "react-native";
import {router} from "expo-router";
import {useTheme} from "./theme";
import {StatusBadge,DeadlineBadge} from "./ui";
import {tap} from "./haptics";
export default function ActivityCard({x,favorite=false,onToggleFavorite}){
 const {C}=useTheme();const s=useMemo(()=>styles(C),[C]);
 const scale=useRef(new Animated.Value(1)).current;
 // 찜을 누르면 하트가 살짝 커졌다 돌아온다.
 function bounce(){
  Animated.sequence([
   Animated.spring(scale,{toValue:1.35,useNativeDriver:true,speed:50,bounciness:14}),
   Animated.spring(scale,{toValue:1,useNativeDriver:true,speed:20,bounciness:10})
  ]).start();
 }
 const fee=x.fee===0?"무료":x.fee?`${Number(x.fee).toLocaleString()}원`:"비용 확인";
 // 원천에 연령 정보가 없으면 기본값(3~12세)을 실제 대상인 것처럼 보이지 않게 한다.
 const age=x.age_known?`${x.age_min}~${x.age_max}세`:"연령 정보 확인 필요";
 return <TouchableOpacity onPress={()=>router.push(`/activity/${x.id}`)} style={s.card} accessibilityRole="button" accessibilityLabel={`${x.title}. ${x.region} ${x.provider||x.place||""}. ${age}. ${fee}. ${x.status||"운영정보 확인"}. 자세히 보기`}>
  <View style={s.icon}><Text style={{fontSize:23}}>🌱</Text></View>
  <View style={{flex:1}}>
    <Text style={s.title}>{x.title}</Text>
    <Text style={s.meta}>{x.region} · {x.provider||x.place||""}</Text>
    <Text style={s.meta}>{age} · {fee}</Text>
    <View style={s.badgeRow}><StatusBadge status={x.status}/><DeadlineBadge applyEnd={x.apply_end} style={{marginLeft:5}}/></View>
    <View style={s.tags}>{(x.skills||[]).slice(0,3).map(t=><Text key={t} style={s.tag}>{t}</Text>)}</View>
    <Text style={s.source}>공식 데이터 · {x.source_name}</Text>
  </View>
  {onToggleFavorite&&<TouchableOpacity style={s.heart} hitSlop={10} onPress={()=>{tap();bounce();onToggleFavorite(x.id)}} accessibilityRole="button" accessibilityState={{selected:favorite}} accessibilityLabel={favorite?`${x.title} 찜 해제`:`${x.title} 찜하기`}><Animated.Text style={[s.heartText,favorite&&s.heartOn,{transform:[{scale}]}]}>{favorite?"♥":"♡"}</Animated.Text></TouchableOpacity>}
 </TouchableOpacity>
}
const styles=C=>StyleSheet.create({
 card:{backgroundColor:C.card,borderWidth:1,borderColor:C.line,borderRadius:19,padding:14,marginBottom:9,flexDirection:"row",gap:11},
 icon:{width:47,height:47,borderRadius:14,backgroundColor:C.soft,alignItems:"center",justifyContent:"center"},
 title:{fontSize:15,fontWeight:"900",color:C.navy,paddingRight:22},meta:{fontSize:10.5,color:C.muted,lineHeight:17},
 badgeRow:{flexDirection:"row",marginTop:6},
 tags:{flexDirection:"row",gap:5,flexWrap:"wrap",marginTop:6},tag:{fontSize:9.5,backgroundColor:C.tagBg,paddingHorizontal:6,paddingVertical:4,borderRadius:99,color:C.tagText},
 source:{fontSize:9.5,color:C.green,marginTop:7},
 heart:{position:"absolute",top:10,right:12,padding:2},heartText:{fontSize:19,color:C.heartOff},heartOn:{color:C.danger}
});
