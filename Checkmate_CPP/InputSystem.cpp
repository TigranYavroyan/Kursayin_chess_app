#include "InputSystem.hpp"
#include <iostream>
#include <utility>
#include <limits> // Add this line to include the <limits> header

InputSystem::InputSystem(): real_from_row{0}, real_to_row{0}, real_from_col{0}, real_to_col{0}, board_size{8}, currentPlayer{WHITE}, response{} {}
InputSystem::~InputSystem() = default;

void InputSystem::setCurrentPlayer(Color change) {
    currentPlayer = change;
}

void InputSystem::set_response(const json& res) {
    response = res;
}

json InputSystem::get_response() const {
    return response;
}

void InputSystem::input_move() {
    char fromRow = 0;
    char toRow = 0;
    char fromCol = ' ';
    char toCol = ' ';
    std::string input;

    std::getline(std::cin, input);
    json request = json::parse(input);
    std::string fromr = request["startRow"];
    std::string fromc = request["startCol"];
    std::string tor = request["endRow"];
    std::string toc = request["endCol"];
    fromCol = fromc[0] - '0';
    fromRow = fromr[0] - '0';
    toCol = toc[0] - '0';
    toRow = tor[0] - '0';

    // if (!_input_checks(fromRow, fromCol, toRow, toCol))
    // {
    //     response = invalid_move_json();
    //     std::cout << response.dump() << std::endl;
    //     return false;
    // }

    // _change(fromRow, toRow, fromCol, toCol);
    set_from_move(fromCol, fromRow);
    set_to_move(toCol, toRow);
}
int InputSystem::get_from_row() const {
    return real_from_row;
}
int InputSystem::get_to_row() const {
    return real_to_row;
}
int InputSystem::get_from_col() const {
    return real_from_col;
}
int InputSystem::get_to_col() const {
    return real_to_col;
}
void InputSystem::print() const {
    std::cout << real_from_row << real_from_col << ' ' << real_to_row << real_to_col;
}
Color InputSystem::get_currentPlayer () const {
    return currentPlayer;
}

void InputSystem::_change(int fromRow, int toRow, int fromCol, int toCol){
    // move parsing change
    real_from_col = fromCol - 'a';
    real_to_col = toCol - 'a';
    real_from_row = board_size - (fromRow - '0');
    real_to_row = board_size - (toRow - '0');
}

void InputSystem::set_from_move(int fromCol, int fromRow) {
    real_from_col = fromCol;
    real_from_row = fromRow;
}

void InputSystem::set_to_move(int toCol, int toRow) {
    real_to_col = toCol;
    real_to_row = toRow;
}

bool InputSystem::_input_checks(int fromRow, int fromCol, int toRow, int toCol) const {
    return ((fromCol >= 'a' && fromCol <= 'h') && (toCol >= 'a' && toCol <= 'h') && (fromRow >= '1' && fromRow <= '8') && (toRow >= '1' && toRow <= '8'));
}

json InputSystem::invalid_move_json () const {
    return json({
            { "type", "response" },
            { "valid", "false" },
            { "state", "invalid_move" }
        });
}

std::pair<std::string, std::string> InputSystem::_get_rock_pos () const {
    if (real_to_row == 7 && real_to_col == 6)
        return {"63", "61"};
    else if (real_to_row == 7 && real_to_col == 2)
        return {"56", "58"};
    else if (real_to_row == 0 && real_to_col == 6)
        return {"7", "5"};
    else if (real_to_row == 0 && real_to_col == 2)
        return {"0", "3"};
    else 
        return {"-1", "-1"};
}

json InputSystem::valid_move_json (bool game_end, bool is_castling) const {
    if (is_castling) {
        auto pair = _get_rock_pos();
        return json({
                { "game_end", "false" },
                { "type", "response" },
                { "valid", "true" },
                { "state", "castling" },
                { "rockStart", pair.first},
                { "rockEnd", pair.second},
            });
    }
    else if (game_end) {
        return json({
                { "game_end", "true" },
                { "type", "response" },
                { "valid", "true" },
                { "state", "valid_move" }
            });
    }
    else {
        return json({
                { "game_end", "false" },
                { "type", "response" },
                { "valid", "true" },
                { "state", "valid_move" }
            });
    }
}