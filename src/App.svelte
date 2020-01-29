<script>
  import Copy from './Copy.svelte'
  import Spinner from 'svelte-spinner'

  let url = ''
  let message409visibility = false
  let message409 = 'That is already a vURL link'
  const regexurl = /[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)?/gi;
  $: urlsanitized = decodeURI(url).slice(0, 100) 
  $: urlsanitizedvisibility = decodeURI(url) !== url
  let apiurl = 'https://vurl.ir/apiv1'
  let redirecturl = 'https://vurl.ir/'
  let shorturlcomplete = false 
  let validationerror = false
  let validationmessage = ''
  let loading = false
  let pastemode = true

  let onenter = (e) => {
	if (e.keyCode == 13) {
      geturl()
	}
  }
  let onchange = (e) => {
	setTimeout(() => {
	  if (url === '') {
	    pastemode = true  
	  }	 else {
	    pastemode =  false 
	  }
	}, 0)	
  }

  let selectinputtext = (e) => {
    e.target.select()
  }

  let onpaste = () => {
	pastemode = true  
    setTimeout( () => {geturl()}, 0)
  }

  async function paste(input) {
  	url = await navigator.clipboard.readText();
  }

  let geturl = () => {
	if (pastemode) {
      paste().then((e) => {
	    fetchurl()
      })
	} else {
	  fetchurl()
	}
  }

  let fetchurl = () => {
    message409visibility = false
	if (url && url !== '' && urlsanitized.match(regexurl)) {
      // TODO: remove this line after implement API
      validationerror = false
	  loading = true	  
	  shorturlcomplete = ''
	  fetch(apiurl, {
        method: 'POST',
		body: new URLSearchParams(`url=${url}`)
	  })
	  .then((response) => {
		if (response.status === 201) {
	      return response.text().then((i) => {
		    shorturlcomplete = `${redirecturl}${i}`
 	        loading = false  
	        pastemode = true  
		  })
		} else if (response.status === 409) {
            message409visibility = true
 	        loading = false  
	        pastemode = true  
		}
	  })
	  .catch((e) => {
 	    loading = false	  
	  })
	} else {
      validationerror = true
	  validationmessage = 'Enter Your URL !'  
	}
  }
</script>

<main>
  <img
    class="brand"
    src="/static/vurl-logo.png" />
  <br/>
  <div class="container">
  <input
    required
    bind:value={url}
    on:input={onchange}
	on:keydown={onenter}
    on:click={selectinputtext}
    on:paste={onpaste}
    placeholder="Enter your long URL"
    type="text" />
  <button 
    on:click={geturl} >
    {#if loading}
      <Spinner
      size="20"
      speed="750"
      color="#fff"
      thickness="2"
      gap="40"
    />
    {/if} 
    {#if !loading}
      {#if pastemode}
        PASTE & GO
      {/if}
      {#if !pastemode}
        GO
      {/if}
    {/if}
  </button>
  <p class="sanitizedurl"> 
    {#if urlsanitizedvisibility}
      { urlsanitized } 
    {/if}
  </p>
  </div>
  <p class="error">
    {#if validationerror}
      { validationmessage }
    {/if}
    {#if message409visibility}
      { message409 }
    {/if}
  </p>
  <div class="container resultplot">
  {#if shorturlcomplete}
    <h2>
      <a 
	    target="_blank"
	    href={shorturlcomplete} >{ shorturlcomplete }</a>
    </h2>
    <Copy bind:value={shorturlcomplete} />
  {/if}
  </div>
  <footer>
    <span class="lovetext">
	  Made for you by Open Source community with <img width="10" src="/static/heart.svg"/>
	</span>
    <ul>
	  <li>
         <a 
		   target="_blank"
		   href="https://github.com/vurl" >GITHUB</a>
	  </li>
	  <li>
         <a 
		   target="_blank"
		   href="https://github.com/vurl/vurl-cli" >CLI</a>
	  </li>
    </ul>
  </footer>
</main>


<style>
  main {
    background: white;
  	text-align: center;
  }

  .brand {
    width: 160px;
    margin-top: 10%;
    margin-bottom: 30px;
  }
  
  h1 {
  	color: #ff3e00;
  	text-transform: uppercase;
  	font-size: 4em;
  	font-weight: 100;
  } 
  
  h2 {
    background: #f1f1f1;
    display: block;
    float: left;
    height: 46px;
    padding: 0;
    margin: 0;
	font-weight: normal;
	line-height: 46px;
    border-radius: 100px;
    width: calc(100% - 130px);
  }

  .container {
    display: block;
    clear: both;
    width: 660px;
    min-width: 300px;
	max-width: 90%;
    margin: 0 auto;
  }

  .resultplot {
    margin-top: 0px;
  }

  input {
    display: block;
    float: left;
    padding: 0 20px;
    height: 46px;
	line-height: 46px;
    border-radius: 100px;
    width: calc(100% - 130px);
  }

  button {
    border-radius: 100px;
    width: 120px;
    height: 46px;
    background: #AB61B7 !important;		
    color: white;			
    float: right;
    border: none;
  }

  .sanitizedurl {
    display: block;
    width: 90%;  
    margin: 0 5%;		   
    overflow: hidden;	   
    clear: both;
    color: #888;
	white-space: nowrap;
	text-overflow: ellipsis;
  }

  .error {
    display: block;
    width: 100%;
    height: 30px;
    margin-top: 0;
    padding: 0;
    color: red;
    font-size: 12px;
  }

  .lovetext {
    font-size: 12px;
    float: left;
    color: #999;
  }


  footer {
    width: 90%;
    margin: 0 5%;
    height: 48px;
    color: black;
    list-style: none;
    display: block;
    position: fixed;
    bottom: 0;
  } 

  footer ul {
    padding: 0;
    margin: 0;
  }

  footer li {
    display: block;
	float: right;		 
	list-style: none;
	font-size: 12px;
	margin-left: 2em;
  }

  footer a {
    color: #999;
  }

  @media (max-width: 640px) {
    .brand {
      width: 160px;
      margin-top: 10%;
      margin-bottom: 30px;
    }

  	main {
  		max-width: none;
  	}

	container {
      width: 100%;
      float: left;	  
	}

	input {
      width: 100%;
	}

    button {
      width: 100%;
	}

	h2 {
      width: calc(100% - 40px);
	  padding: 0 20px;
	  text-overflow: ellipsis;
	  white-space: nowrap;
      overflow: hidden;
	  font-size: 18px;
	}

	h2 a {
	  text-overflow: ellipsis;
	  white-space: nowrap;
	}

	.lovetext {
      width: 100%;
	  margin-bottom: 10px;
	}

	footer {
      height: 60px;
      position: absolute;
	}

	footer ul {
      height: 50px;
	}

	footer li {
     width: 50%;
     float: left;
	 text-align: center;
     height: 32px;
	 margin-top: 10px;
	 margin-left: 0em;
	}
  }
</style>
