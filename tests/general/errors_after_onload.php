<a href='errors.php'>errors.php</a>
<button id="add_errors">Load errors.php</button>
<div id="errors"></div>

<script type="text/javascript">
        const errors_div = document.getElementById("errors");
        const add_errors_btn = document.getElementById("add_errors"); 

        add_errors_btn.onclick = async e => {
                const r = await fetch("errors.php");
                errors_div.innerHTML = await r.text();
        };
</script>