# $1 is a list of TabCode files in dir $2

cat $1 | while read k;
 do
  FULLPATH=$2$k;
#   echo $FULLPATH;
   ./multi_index_file.sh $FULLPATH; 
 done