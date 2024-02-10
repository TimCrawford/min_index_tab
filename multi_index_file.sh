# for j in $1/*tc;
# do 
  name=$(basename $1); 
  for i in 64 96 128 192 256 384 512 768 1024 ;
   do 
    echo -n ${name%.tc}"_"$i".tc: ";
    file_encoded=$(node 'url_encode.js' $1)
    code=$(curl -sf "http://www.doc.gold.ac.uk/www/491/min_index_tab?encode=true&timehop=$i&file=$file_encoded");
    echo $code;
  done; 
# done
