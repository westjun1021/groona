
import React from "react";
import {View,Text,TouchableOpacity,StyleSheet} from "react-native";
import {router} from "expo-router";
import {C} from "./theme";
import {StatusBadge} from "./ui";
export default function ActivityCard({x,favorite=false,onToggleFavorite}){
 const fee=x.fee===0?"무료":x.fee?`${Number(x.fee).toLocaleString()}원`:"비용 확인";
 return <TouchableOpacity onPress={()=>router.push(`/activity/${x.id}`)} style={s.card} accessibilityRole="button" accessibilityLabel={`${x.title}. ${x.region} ${x.provider||x.place||""}. ${x.age_min}~${x.age_max}세. ${fee}. ${x.status||"운영정보 확인"}. 자세히 보기`}>
  <View style={s.icon}><Text style={{fontSize:23}}>🌱</Text></View>
  <View style={{flex:1}}>
    <Text style={s.title}>{x.title}</Text>
    <Text style={s.meta}>{x.region} · {x.provider||x.place||""}</Text>
    <Text style={s.meta}>{x.age_min}~{x.age_max}세 · {fee}</Text>
    <View style={s.badgeRow}><StatusBadge status={x.status}/></View>
    <View style={s.tags}>{(x.skills||[]).slice(0,3).map(t=><Text key={t} style={s.tag}>{t}</Text>)}</View>
    <Text style={s.source}>공식 데이터 · {x.source_name}</Text>
  </View>
  {onToggleFavorite&&<TouchableOpacity style={s.heart} hitSlop={10} onPress={()=>onToggleFavorite(x.id)} accessibilityRole="button" accessibilityState={{selected:favorite}} accessibilityLabel={favorite?`${x.title} 찜 해제`:`${x.title} 찜하기`}><Text style={[s.heartText,favorite&&s.heartOn]}>{favorite?"♥":"♡"}</Text></TouchableOpacity>}
 </TouchableOpacity>
}
const s=StyleSheet.create({
 card:{backgroundColor:C.card,borderWidth:1,borderColor:C.line,borderRadius:19,padding:14,marginBottom:9,flexDirection:"row",gap:11},
 icon:{width:47,height:47,borderRadius:14,backgroundColor:C.soft,alignItems:"center",justifyContent:"center"},
 title:{fontSize:15,fontWeight:"900",color:C.navy,paddingRight:22},meta:{fontSize:10.5,color:C.muted,lineHeight:17},
 badgeRow:{flexDirection:"row",marginTop:6},
 tags:{flexDirection:"row",gap:5,flexWrap:"wrap",marginTop:6},tag:{fontSize:9.5,backgroundColor:"#F2F6F8",paddingHorizontal:6,paddingVertical:4,borderRadius:99,color:"#4F6473"},
 source:{fontSize:9.5,color:C.green,marginTop:7},
 heart:{position:"absolute",top:10,right:12,padding:2},heartText:{fontSize:19,color:"#C3D0D8"},heartOn:{color:C.danger}
});
