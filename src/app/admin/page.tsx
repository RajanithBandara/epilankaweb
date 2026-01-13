'use client';

function AdminLogin(){
    return(
        <>
            <div className={"font-bold"}>
                Admin Login Page
            </div>
            <div className={"text-center"}>
                <form onSubmit={(e) => e.preventDefault()}>
                    <input type="text" placeholder="Username" className={"border-2 m-2 p-2 rounded-lg"}/><br/>
                    <input type="password" placeholder="Password" className={"border-2 m-2 p-2 rounded-lg"}/><br/>
                    <button type="submit" className={"bg-blue-500 text-white p-2 rounded-lg m-2"}>Login</button>
                </form>
            </div>
        </>
    )
}

export default AdminLogin;