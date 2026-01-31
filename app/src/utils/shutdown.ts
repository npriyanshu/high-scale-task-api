export async function shutdown(name:string,fn:()=>Promise<void>){

    try {
        console.log(`${name} shutting down`);
        await fn();
        console.log(`${name} shut down successfully`);
    } catch (error) {
        console.error(`${name} failed to shut down`,error);
    }

}