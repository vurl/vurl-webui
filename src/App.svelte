<script>
  import Copy from './Copy.svelte'
  import Spinner from 'svelte-spinner'

  let url = ''
  $: urlsanitized = decodeURI(url).slice(0, 50) 
  $: urlsanitizedvisibility = decodeURI(url) !== url
  let apiurl = 'https://vurl.ir/apiv1'
  let redirecturl = 'https://vurl.ir/'
  let shorturlcomplete = false 
  let validationerror = false
  let validationmessage = ''
  let loading = false

  let onenter = (e) => {
	if (e.keyCode == 13) {
      geturl()
	}
  }

  let selectinputtext = (e) => {
    e.target.select()
  }

  let onpaste = () => {
    setTimeout( () => {geturl()}, 0)
  }

  let geturl = () => {
	// console.log('get url')
	if (url && url !== '') {
      // TODO: remove this line after implement API
      validationerror = false
	  loading = true	  
	  shorturlcomplete = ''

	  fetch(apiurl, {
        method: 'POST',
		body: new URLSearchParams(`url=${url}`)
	  })
	  .then((response) => {
	    return response.text()
	  })
	  .then((i) => {
		shorturlcomplete = `${redirecturl}${i}`
 	    loading = false  
	  })
	  .catch(() => {
        validationerror = true
	    validationmessage = 'Server Error'  
 	    loading = false	  
	  })
	  

	} else {
      validationerror = true
	  validationmessage = 'Enter Your URL !!'  
	}
  }
</script>

<main>
  <img
    class="brand"
    src="/static/vurl-logo.png" />
  <br/>
  <p>
  <input
    required
    bind:value={url}
	on:keydown={onenter}
    on:click={selectinputtext}
    on:paste={onpaste}
    placeholder="Enter your long URL"
    type="text" />
  <button on:click={geturl} >GO</button>
  </p>
  {#if urlsanitizedvisibility}
    <p class="sanitizedurl"> { urlsanitized } </p>
  {/if}
  {#if shorturlcomplete}
    <h2>
      <a 
	    target="_blank"
	    href={shorturlcomplete} >{ shorturlcomplete }</a>
      <Copy bind:value={shorturlcomplete} />
    </h2>
  {/if}
  {#if validationerror}
  <p  class="error">
    { validationmessage }
  </p>
  {/if}
  {#if loading}
  <Spinner
  size="50"
  speed="750"
  color="#999"
  thickness="2"
  gap="40"
  />
  {/if}
  <footer>
    <ul>
	  <li>
         <a 
		   target="_blank"
		   href="https://github.com/vurl" >GITHUB</a>
	  </li>
    </ul>
  </footer>
</main>


<style>
  main {
    background: white;
  	text-align: center;
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
    font-weight: normal;
  }

  input {
    padding: 0 20px;
    height: 46px;
	line-height: 46px;
    border-radius: 100px;
    width: 460px;
    min-width: 300px;
	max-width: 90%;
  }

  button {
    border-radius: 100px;
    width: 86px;
    height: 46px;
    background: #AB61B7 !important;		
    color: white;			
    border: none;
  }

  .sanitizedurl {
    color: #888;
    margin-top: 0;
  }

  .error {
    color: red;
  }

  @media (min-width: 640px) {
  	main {
  		max-width: none;
  	}
  }
</style>
