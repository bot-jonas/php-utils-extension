<a href='errors_after_onload.php'>errors_after_onload.php</a>
<?php

        ini_set('display_errors', 1);
        ini_set('display_startup_errors', 1);
        error_reporting(E_ALL);

        $a = [];
        $n = 10;

        while($n--) {
	        echo var_dump($a['test']);

	        echo var_dump(1 / 0);
    	}

        echo var_dump($a + 3);