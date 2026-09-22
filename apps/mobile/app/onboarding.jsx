
import React,{useMemo,useRef,useState} from "react";
import {SafeAreaView,ScrollView,View,Text,TouchableOpacity,StyleSheet,useWindowDimensions} from "react-native";
import {router,useLocalSearchParams} from "expo-router";
import {useTheme} from "../src/theme";
import {setOnboarded} from "../src/onboarding";
import {tap,success} from "../src/haptics";
const SLIDES=[
 {icon:"🌱",title:"부산·울산·경남의\n공개 프로그램을 모읍니다",
  body:"공공기관이 공개한 어린이 학습·체험 정보를 자동으로 수집해 한곳에서 보여드립니다. 출처와 수집 정보를 항상 함께 표시하고, 최종 신청 여부는 공식 기관에서 확인하도록 안내합니다."},
 {icon:"🧭",title:"성장영역으로\n큐레이션합니다",
  body:"과학·탐구, 창의·예술, 언어·독서, 신체·놀이, 역사·지역, 사회·생활 — 여섯 영역으로 분류해 아이에게 지금 필요한 경험을 찾기 쉽게 정리합니다."},
 {icon:"📈",title:"자녀별로\n성장을 기록합니다",
  body:"활동을 완료 체크하면 자녀별 성장 리포트에 쌓입니다. 어떤 영역을 더 경험해보면 좋을지 한눈에 확인할 수 있습니다."}
];
export default function Onboarding(){
 const {C}=useTheme();const s=useMemo(()=>styles(C),[C]);
 const {width}=useWindowDimensions();
 // 설정 → "앱 소개 다시 보기"로 연 경우. 첫 실행 온보딩과 달리 플래그를 건드리지 않고 되돌아간다.
 const params=useLocalSearchParams();
 const review=(Array.isArray(params.review)?params.review[0]:params.review)==="1";
 const ref=useRef(null);
 const [page,setPage]=useState(0);
 const last=page===SLIDES.length-1;
 async function finish(dest){
  success();
  if(review){                    // 다시 보기: 저장 상태를 바꾸지 않는다
   if(dest==="/login")router.push("/login");else router.back();
   return;
  }
  await setOnboarded();          // 완료든 건너뛰기든 다시 보이지 않게 한다
  router.replace(dest);
 }
 function next(){
  tap();
  const to=Math.min(page+1,SLIDES.length-1);
  ref.current&&ref.current.scrollTo({x:to*width,animated:true});
  setPage(to);
 }
 return <SafeAreaView style={s.safe}>
  <View style={s.top}>
   <Text style={s.logo}>GROO<Text style={{color:C.mint}}>N</Text><Text style={{color:C.yellow}}>A</Text></Text>
   <TouchableOpacity onPress={()=>finish("/")} hitSlop={10} accessibilityRole="button" accessibilityLabel={review?"앱 소개 닫기":"온보딩 건너뛰기"}>
    <Text style={s.skip}>{review?"닫기":"건너뛰기"}</Text>
   </TouchableOpacity>
  </View>
  <ScrollView ref={ref} horizontal pagingEnabled showsHorizontalScrollIndicator={false}
   onMomentumScrollEnd={e=>setPage(Math.round(e.nativeEvent.contentOffset.x/width))}
   style={{flexGrow:0}}>
   {SLIDES.map((x,i)=><View key={i} style={[s.slide,{width}]}>
    <Text style={s.icon}>{x.icon}</Text>
    <Text style={s.eyebrow}>오늘의 경험, 내일의 성장</Text>
    <Text style={s.title}>{x.title}</Text>
    <Text style={s.body}>{x.body}</Text>
   </View>)}
  </ScrollView>
  <View style={s.dots}>{SLIDES.map((_,i)=><View key={i} style={[s.dot,i===page&&s.dotOn]}/>)}</View>
  <View style={s.actions}>
   {last?<>
    <TouchableOpacity style={s.btn} onPress={()=>finish("/login")} accessibilityRole="button" accessibilityLabel="자녀 등록 또는 로그인">
     <Text style={s.btnText}>자녀 등록 / 로그인</Text>
    </TouchableOpacity>
    <TouchableOpacity style={s.ghost} onPress={()=>finish("/")} accessibilityRole="button" accessibilityLabel="로그인 없이 둘러보기">
     <Text style={s.ghostText}>둘러보기</Text>
    </TouchableOpacity>
   </>:<TouchableOpacity style={s.btn} onPress={next} accessibilityRole="button" accessibilityLabel="다음 화면">
    <Text style={s.btnText}>다음</Text>
   </TouchableOpacity>}
   <Text style={s.note}>보호자 계정 아래에 자녀 프로필을 만드는 구조입니다. 로그인 없이도 프로그램은 둘러볼 수 있어요.</Text>
  </View>
 </SafeAreaView>
}
const styles=C=>StyleSheet.create({
 safe:{flex:1,backgroundColor:C.bg},
 top:{flexDirection:"row",justifyContent:"space-between",alignItems:"center",paddingHorizontal:20,paddingTop:10,paddingBottom:6},
 logo:{fontSize:22,fontWeight:"900",color:C.blue},
 skip:{fontSize:12,fontWeight:"800",color:C.muted},
 slide:{paddingHorizontal:26,paddingTop:30},
 icon:{fontSize:54},
 eyebrow:{color:C.green,fontSize:10.5,fontWeight:"900",letterSpacing:1,marginTop:18},
 title:{fontSize:27,lineHeight:37,fontWeight:"900",color:C.navy,marginTop:9},
 body:{fontSize:13,lineHeight:22,color:C.muted,marginTop:14},
 dots:{flexDirection:"row",gap:6,justifyContent:"center",marginTop:8},
 dot:{width:7,height:7,borderRadius:99,backgroundColor:C.line},
 dotOn:{backgroundColor:C.blue,width:18},
 actions:{paddingHorizontal:22,paddingBottom:18,marginTop:"auto"},
 btn:{backgroundColor:C.blue,padding:15,borderRadius:14,alignItems:"center"},
 btnText:{color:C.onAccent,fontWeight:"900",fontSize:13.5},
 ghost:{borderWidth:1,borderColor:C.line,backgroundColor:C.card,padding:14,borderRadius:14,alignItems:"center",marginTop:9},
 ghostText:{color:C.navy,fontWeight:"800",fontSize:13},
 note:{fontSize:10.5,color:C.muted,lineHeight:17,textAlign:"center",marginTop:14}
});
