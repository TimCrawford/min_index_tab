# Derive diatonic-interval codestring from TabCode file (.tc) $1

tc=$1;
echo;echo $(basename $tc);
for i in 64 96 128 192 256 384 512 768 1024;
do
	echo -n $i"	"
# 	node parsetab/parsetab.js $tc | 
# 	  node label_harm_windows.js -T $i |
# 	    tail -n 1;
	node ./index_single_tc_topline.js $tc $i;
done
echo
