using System.Net.WebSockets;
using System.Text;
using Newtonsoft.Json;

var builder = WebApplication.CreateBuilder(args);
var app = builder.Build();

app.UseWebSockets();

app.Map("/ws", async context =>
{
    if (context.WebSockets.IsWebSocketRequest)
    {
        var webSocket = await context.WebSockets.AcceptWebSocketAsync();
        Console.WriteLine("WebSocket connection established");

        Random random = new Random();

        while (webSocket.State == WebSocketState.Open)
        {
            var timeData = new
            {
                value = random.Next(1, 10),
                time = (long)DateTime.Now.ToUniversalTime().Subtract(new DateTime(1970, 1, 1, 0, 0, 0, DateTimeKind.Utc)).TotalMilliseconds
            };

            string jsonMessage = JsonConvert.SerializeObject(timeData);
            var bytes = Encoding.UTF8.GetBytes(jsonMessage);

            await webSocket.SendAsync(new ArraySegment<byte>(bytes), WebSocketMessageType.Text, true, CancellationToken.None);
            await Task.Delay(1000);
        }
    }
    else
    {
        context.Response.StatusCode = 400;
        await context.Response.WriteAsync("WebSocket requests only.");
    }
});

app.Run();
