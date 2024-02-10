./topline_multi_codestring_tc.sh $1 | awk	'
	BEGIN {got_name = 0;}
	{	
		if(length($0)==0) next;
		if(got_name == 0){
			name = substr($1,1,length($1)-3);
			got_name = 1;
			next;
		}
		print name "_" $1 ".tc\t" $2
	}'