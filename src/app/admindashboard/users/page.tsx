'use client';

import {useState} from "react";

function UserPage(){
    const [studentname] = useState('');

    function handleSubmit(){
        console.log(studentname);
    }
    return(
        <div>
            <form>
                <input type="text" placeholder="Search" value={studentname}/>
                <input type={"text"} placeholder={"email"} value={studentname}/>
                <button type={"submit"} onSubmit={handleSubmit}>Submit</button>
            </form>
        </div>
    )
}

export default UserPage;