let myBtn = document.getElementById("myButton");
window.onscroll = function(){scrollFn()};
function scrollFn(){
    if(document.body.scrollTop>20 || document.documentElement.scrollTop>20){
        myBtn.style.display="block";
    }
    else{
        myBtn.style.display="none";
    }
}   
function Top(){
    window.scrollTo({top:0 , behavior:"smooth"});
}